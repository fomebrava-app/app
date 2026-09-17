import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isPasswordStrong } from "@/lib/password";

interface SignupBody {
  full_name: string;
  email: string;
  telefone: string;
  password: string;
}

// Rota pública: qualquer pessoa que acessar /admin/login pode criar uma
// conta de admin por aqui (risco aceito conscientemente pelo organizador
// para um sistema de curta duração — ver plano). Sempre promove a
// 'admin' explicitamente; nunca aceita um campo de role vindo do client.
export async function POST(request: Request) {
  const body = (await request.json()) as Partial<SignupBody>;
  const fullName = body.full_name?.trim();
  const email = body.email?.trim();
  const telefone = body.telefone?.trim();
  const password = body.password ?? "";

  if (!fullName || !email || !telefone || !password) {
    return NextResponse.json({ error: "Preencha todos os campos." }, { status: 400 });
  }

  if (!isPasswordStrong(password)) {
    return NextResponse.json({ error: "A senha não atende aos requisitos de segurança." }, { status: 400 });
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
