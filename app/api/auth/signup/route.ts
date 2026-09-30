import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPasswordStrong } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";
import { canonicalSignupCode, hashSignupCode } from "@/lib/signup-code";
import { isValidTenantSlug, normalizeTenantSlug } from "@/lib/tenant-slug";
import type { SupabaseClient } from "@supabase/supabase-js";

interface SignupBody {
  full_name: string;
  email: string;
  telefone: string;
  password: string;
  invite_code: string;
  tenant_slug: string;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

function missingSignupTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || (error.message ?? "").includes("signup_codes");
}

// Cada cadastro cria um tenant novo. O código é de uso único e o slug
// sai do campo "usuário", não de um valor fixo. A service role só entra
// aqui, no servidor; o cliente não escolhe tenant_id nem role.
export async function POST(request: Request) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
  if (!checkRateLimit(`signup:${ip}`, 5, 15 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Muitas tentativas. Aguarde alguns minutos e tente de novo." },
      { status: 429 }
    );
  }

  const body = (await request.json().catch(() => null)) as Partial<SignupBody> | null;
  if (!body) {
    return NextResponse.json({ error: "Corpo da requisição inválido." }, { status: 400 });
  }

  const fullName = str(body.full_name);
  const email = str(body.email);
  const telefone = str(body.telefone);
  const inviteCode = str(body.invite_code);
  const tenantSlug = normalizeTenantSlug(str(body.tenant_slug));
  const password = typeof body.password === "string" ? body.password : "";
  const canonicalCode = canonicalSignupCode(inviteCode);

  if (!fullName || !email || !telefone || !password || !inviteCode || !tenantSlug) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (!isValidTenantSlug(tenantSlug)) {
    return NextResponse.json(
      {
        error:
          "Usuário inválido. Use só letras minúsculas, números e hífen (3-50 caracteres).",
      },
      { status: 400 }
    );
  }

  if (!isPasswordStrong(password)) {
    return NextResponse.json({ error: "A senha não atende aos requisitos de segurança." }, { status: 400 });
  }

  const admin = createAdminClient();
  const probe = await admin.from("signup_codes").select("id").limit(1);

  let claimedId: string | null = null;
  if (missingSignupTable(probe.error)) {
    const expectedCode = process.env.ADMIN_SIGNUP_CODE;
    if (!expectedCode || !safeEqual(inviteCode, expectedCode)) {
      return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 });
    }
  } else if (probe.error) {
    console.error("signup: falha ao validar código de acesso");
    return NextResponse.json({ error: "Cadastro temporariamente indisponível." }, { status: 503 });
  } else {
    if (!canonicalCode) {
      return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 });
    }
    const { data: claimed, error: claimError } = await admin
      .from("signup_codes")
      .update({ used_at: new Date().toISOString() })
      .eq("code_hash", hashSignupCode(canonicalCode))
      .is("used_at", null)
      .select("id")
      .maybeSingle();

    if (claimError || !claimed) {
      if (claimError) console.error("signup: falha ao reservar código de acesso");
      return NextResponse.json(
        { error: claimError ? "Cadastro temporariamente indisponível." : "Código de acesso inválido." },
        { status: claimError ? 503 : 401 }
      );
    }
    claimedId = claimed.id;
  }

  let tenantId: string | null = null;
  let userId: string | null = null;
  let profileLinked = false;

  try {
    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({ slug: tenantSlug, nome: tenantSlug })
      .select("id, slug")
      .single();

    if (tenantError || !tenant) {
      const duplicated = tenantError?.message.toLowerCase().includes("duplicate");
      throw new SignupFailure(
        duplicated ? "Esse usuário já está em uso." : (tenantError?.message ?? "Erro ao criar a loja."),
        duplicated ? 409 : 400
      );
    }
    tenantId = tenant.id;

    const { data, error } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: fullName },
    });

    if (error || !data.user) {
      const duplicated = error?.message?.toLowerCase().includes("already registered");
      throw new SignupFailure(
        duplicated ? "Este e-mail já está cadastrado." : (error?.message ?? "Erro ao criar conta."),
        duplicated ? 409 : 400
      );
    }
    userId = data.user.id;

    const { error: profileError } = await admin
      .from("profiles")
      .update({ role: "admin", telefone, tenant_id: tenant.id })
      .eq("id", data.user.id);

    if (profileError) throw new SignupFailure(profileError.message, 400);
    profileLinked = true;

    const { error: settingsError } = await admin
      .from("event_settings")
      .insert({ tenant_id: tenant.id, event_name: "Meu Evento" });

    if (settingsError) throw new SignupFailure(settingsError.message, 400);

    if (claimedId) {
      const { error: usedByError } = await admin
        .from("signup_codes")
        .update({ used_by: data.user.id })
        .eq("id", claimedId);

      if (usedByError) throw new SignupFailure(usedByError.message, 400);
    }

    return NextResponse.json({ ok: true, tenantSlug: tenant.slug });
  } catch (err) {
    await rollbackSignup(admin, {
      claimedId,
      tenantId,
      userId,
      profileLinked,
    });
    if (err instanceof SignupFailure) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    console.error("signup: falha inesperada ao criar a loja");
    return NextResponse.json({ error: "Erro ao criar conta." }, { status: 400 });
  }
}

class SignupFailure extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

// Desfaz o que esta tentativa criou e devolve o código, salvo quando o
// perfil já ficou ligado à loja — nesse caso o código permanece usado.
async function rollbackSignup(
  admin: SupabaseClient,
  state: {
    claimedId: string | null;
    tenantId: string | null;
    userId: string | null;
    profileLinked: boolean;
  }
) {
  if (state.profileLinked) return;

  if (state.userId) {
    await admin.auth.admin.deleteUser(state.userId);
  }
  if (state.tenantId) {
    await admin.from("tenants").delete().eq("id", state.tenantId);
  }
  if (!state.claimedId) return;
  await admin
    .from("signup_codes")
    .update({ used_at: null })
    .eq("id", state.claimedId)
    .is("used_by", null);
}
