import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { verifyPdvPassword } from "@/lib/pdv-auth";

// Rota pública: verifica a senha de um link de PDV. Não cria sessão nem
// cookie — a senha validada aqui é reenviada pelo client em cada pedido
// (ver app/api/orders/route.ts), então essa checagem é só feedback
// imediato de UX ("senha incorreta") antes de liberar a tela de venda.
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  const { token } = await params;
  const { password } = (await request.json()) as { password?: string };

  if (!password) {
    return NextResponse.json({ error: "Informe a senha." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("pdv_links")
    .select("password_hash, ativo")
    .eq("token", token)
    .maybeSingle();

  if (!link || !link.ativo || !verifyPdvPassword(password, link.password_hash)) {
    return NextResponse.json({ error: "Senha incorreta." }, { status: 401 });
  }

  return NextResponse.json({ ok: true });
}
