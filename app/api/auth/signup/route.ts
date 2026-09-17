import { createHash, timingSafeEqual } from "crypto";
import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPasswordStrong } from "@/lib/password";
import { checkRateLimit } from "@/lib/rate-limit";

interface SignupBody {
  full_name: string;
  email: string;
  telefone: string;
  password: string;
  invite_code: string;
}

function str(value: unknown): string {
  return typeof value === "string" ? value.trim() : "";
}

// Compara em tempo constante hasheando os dois lados primeiro — evita a
// exigência do timingSafeEqual de buffers do mesmo tamanho (mesma técnica
// de crypto usada em lib/pdv-auth.ts, adaptada para um segredo único
// guardado em variável de ambiente em vez de hash por registro).
function safeEqual(a: string, b: string): boolean {
  const hashA = createHash("sha256").update(a).digest();
  const hashB = createHash("sha256").update(b).digest();
  return timingSafeEqual(hashA, hashB);
}

// Rota antes pública sem nenhuma verificação — agora exige um código de
// acesso conhecido só pelos organizadores (ADMIN_SIGNUP_CODE, nunca
// exposto ao client) para reduzir o risco de qualquer pessoa que ache a
// URL criar uma conta de admin. Sempre promove a 'admin' explicitamente;
// nunca aceita um campo de role vindo do client.
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
  const password = typeof body.password === "string" ? body.password : "";

  if (!fullName || !email || !telefone || !password || !inviteCode) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (!isPasswordStrong(password)) {
    return NextResponse.json({ error: "A senha não atende aos requisitos de segurança." }, { status: 400 });
  }

  const expectedCode = process.env.ADMIN_SIGNUP_CODE;
  if (!expectedCode) {
    // Fail-closed: sem o código configurado no ambiente, não deixamos
    // ninguém se cadastrar em vez de abrir a rota sem proteção por engano.
    return NextResponse.json({ error: "Cadastro temporariamente indisponível." }, { status: 503 });
  }
  if (!safeEqual(inviteCode, expectedCode)) {
    return NextResponse.json({ error: "Código de acesso inválido." }, { status: 401 });
  }

  const admin = createAdminClient();

  const { data, error } = await admin.auth.admin.createUser({
    email,
    password,
    email_confirm: true,
    user_metadata: { full_name: fullName },
  });

  if (error || !data.user) {
    const duplicated = error?.message?.toLowerCase().includes("already registered");
    return NextResponse.json(
      { error: duplicated ? "Este e-mail já está cadastrado." : (error?.message ?? "Erro ao criar conta.") },
      { status: duplicated ? 409 : 400 }
    );
  }

  const { error: profileError } = await admin
    .from("profiles")
    .update({ role: "admin", telefone })
    .eq("id", data.user.id);

  if (profileError) {
    return NextResponse.json({ error: profileError.message }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
