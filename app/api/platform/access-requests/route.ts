import { randomInt } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/platform-admin";
import { isValidTenantSlug, normalizeTenantSlug } from "@/lib/tenant-slug";
import type { SupabaseClient } from "@supabase/supabase-js";

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function text(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

function missingColumn(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST204" || (error.message ?? "").includes("registered_at");
}

function provisionalPassword(): string {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnopqrstuvwxyz";
  const digits = "23456789";
  const special = "!@#$%&*";
  const all = upper + lower + digits + special;
  const pick = (set: string) => set[randomInt(set.length)];
  const chars = [pick(upper), pick(lower), pick(digits), pick(special)];
  while (chars.length < 12) chars.push(pick(all));
  for (let i = chars.length - 1; i > 0; i--) {
    const j = randomInt(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

class ApprovalFailure extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

export async function PATCH(request: Request) {
  const adminUser = await requirePlatformAdmin();
  if (!adminUser) return NextResponse.json({ error: "Sem acesso." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: unknown; email?: unknown } | null;
  const id = text(body?.id);
  const email = text(body?.email).toLowerCase();
  if (!id || !EMAIL.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido." }, { status: 400 });
  }

  const admin = createAdminClient();
  const current = await admin
    .from("landing_access_requests")
    .select("id, registered_at")
    .eq("id", id)
    .maybeSingle();

  if (missingColumn(current.error)) {
    const plain = await admin.from("landing_access_requests").select("id").eq("id", id).maybeSingle();
    if (plain.error || !plain.data) {
      return NextResponse.json({ error: "Não foi possível salvar o e-mail." }, { status: 400 });
    }
  } else if (current.error || !current.data) {
    return NextResponse.json({ error: "Não foi possível salvar o e-mail." }, { status: 400 });
  } else if (current.data.registered_at) {
    return NextResponse.json({ error: "Esta resposta já virou uma loja." }, { status: 409 });
  }

  const { error } = await admin.from("landing_access_requests").update({ email }).eq("id", id);
  if (error) return NextResponse.json({ error: "Não foi possível salvar o e-mail." }, { status: 400 });
  return NextResponse.json({ email });
}

export async function POST(request: Request) {
  const adminUser = await requirePlatformAdmin();
  if (!adminUser) return NextResponse.json({ error: "Sem acesso." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as { id?: unknown; alias?: unknown } | null;
  const id = text(body?.id);
  const alias = normalizeTenantSlug(text(body?.alias));
  if (!id) return NextResponse.json({ error: "Resposta não encontrada." }, { status: 400 });
  if (!isValidTenantSlug(alias)) {
    return NextResponse.json(
      { error: "Alias inválido. Use só letras minúsculas, números e hífen (3-50 caracteres)." },
      { status: 400 }
    );
  }

  const admin = createAdminClient();
  const current = await admin
    .from("landing_access_requests")
    .select("id, nome, clube, email, whatsapp, registered_at")
    .eq("id", id)
    .maybeSingle();

  if (missingColumn(current.error)) {
    return NextResponse.json(
      { error: "A gravação ainda não está disponível. Rode a migration 0017 no Supabase." },
      { status: 503 }
    );
  }
  if (current.error || !current.data) {
    return NextResponse.json({ error: "Resposta não encontrada." }, { status: 404 });
  }
  if (current.data.registered_at) {
    return NextResponse.json({ error: "Esta resposta já virou uma loja." }, { status: 409 });
  }

  const email = current.data.email.trim().toLowerCase();
  if (!EMAIL.test(email)) {
    return NextResponse.json({ error: "Informe um e-mail válido antes de cadastrar." }, { status: 400 });
  }

  const password = provisionalPassword();
  const nomeLoja = current.data.clube.trim() || alias;
  let tenantId: string | null = null;
  let userId: string | null = null;

  try {
    const { data: tenant, error: tenantError } = await admin
      .from("tenants")
      .insert({ slug: alias, nome: nomeLoja })
      .select("id, slug")
      .single();
    if (tenantError || !tenant) {
      const duplicated = tenantError?.message.toLowerCase().includes("duplicate");
      throw new ApprovalFailure(
        duplicated ? "Esse alias já está em uso." : "Não foi possível criar a loja.",
        duplicated ? 409 : 400
      );
    }
    tenantId = tenant.id;

    const { data: created, error: userError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { full_name: current.data.nome },
    });
    if (userError || !created.user) {
      const duplicated = userError?.message?.toLowerCase().includes("already");
      throw new ApprovalFailure(
        duplicated ? "Este e-mail já está cadastrado." : "Não foi possível criar o usuário.",
        duplicated ? 409 : 400
      );
    }
    userId = created.user.id;

    const { error: profileError } = await admin
      .from("profiles")
      .update({
        role: "admin",
        telefone: current.data.whatsapp,
        tenant_id: tenant.id,
      })
      .eq("id", created.user.id);
    if (profileError) throw new ApprovalFailure("Não foi possível ligar o usuário à loja.", 400);

    const { error: settingsError } = await admin
      .from("event_settings")
      .insert({ tenant_id: tenant.id, event_name: nomeLoja });
    if (settingsError) throw new ApprovalFailure("Não foi possível abrir a loja.", 400);

    const registeredAt = new Date().toISOString();
    const { data: marked, error: markError } = await admin
      .from("landing_access_requests")
      .update({ registered_at: registeredAt })
      .eq("id", id)
      .is("registered_at", null)
      .select("id")
      .maybeSingle();
    if (markError || !marked) {
      throw new ApprovalFailure("Não foi possível concluir o cadastro.", 409);
    }

    return NextResponse.json({
      password,
      registeredAt,
      user: {
        id: created.user.id,
        email,
        fullName: current.data.nome,
        telefone: current.data.whatsapp,
        role: "admin",
        createdAt: registeredAt,
        tenantId: tenant.id,
        slug: tenant.slug,
        handle: null,
      },
    });
  } catch (err) {
    await rollbackApproval(admin, { tenantId, userId });
    if (err instanceof ApprovalFailure) {
      return NextResponse.json({ error: err.message }, { status: err.status });
    }
    return NextResponse.json({ error: "Não foi possível cadastrar a loja." }, { status: 400 });
  }
}

async function rollbackApproval(
  admin: SupabaseClient,
  state: { tenantId: string | null; userId: string | null }
) {
  if (state.userId) await admin.auth.admin.deleteUser(state.userId);
  if (state.tenantId) await admin.from("tenants").delete().eq("id", state.tenantId);
}
