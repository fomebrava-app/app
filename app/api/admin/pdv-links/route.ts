import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { generatePdvToken, hashPdvPassword } from "@/lib/pdv-auth";

interface CreatePdvLinkBody {
  label: string;
  password: string;
}

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin") {
    return NextResponse.json({ error: "Apenas administradores podem criar PDVs." }, { status: 403 });
  }

  const body = (await request.json()) as Partial<CreatePdvLinkBody>;
  const label = body.label?.trim();
  const password = body.password ?? "";

  if (!label || !password) {
    return NextResponse.json({ error: "Preencha o rótulo e a senha." }, { status: 400 });
  }
  if (password.length < 4) {
    return NextResponse.json({ error: "A senha precisa ter ao menos 4 caracteres." }, { status: 400 });
  }

  const token = generatePdvToken();
  const passwordHash = hashPdvPassword(password);

  const { data, error } = await supabase
    .from("pdv_links")
    .insert({ token, label, password_hash: passwordHash, created_by: user.id })
    .select("id, token, label, ativo, created_by, created_at")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }

  return NextResponse.json({ pdvLink: data });
}
