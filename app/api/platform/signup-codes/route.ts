import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { generateSignupCode, hashSignupCode } from "@/lib/signup-code";
import { requirePlatformAdmin } from "@/lib/platform-admin";

export async function POST() {
  const user = await requirePlatformAdmin();
  if (!user) return NextResponse.json({ error: "Sem acesso." }, { status: 403 });

  const admin = createAdminClient();

  for (let attempt = 0; attempt < 5; attempt++) {
    const code = generateSignupCode();
    const { error } = await admin.from("signup_codes").insert({ code_hash: hashSignupCode(code) });
    if (!error) return NextResponse.json({ code });

    const missing = error.code === "PGRST205" || error.message.includes("signup_codes");
    if (missing) {
      return NextResponse.json(
        { error: "A tabela de códigos ainda não existe. Rode a migration 0012 no Supabase." },
        { status: 503 }
      );
    }
    const duplicate = error.message.toLowerCase().includes("duplicate");
    if (!duplicate) {
      return NextResponse.json({ error: "Não foi possível gerar o código." }, { status: 400 });
    }
  }

  return NextResponse.json({ error: "Não foi possível gerar o código." }, { status: 400 });
}
