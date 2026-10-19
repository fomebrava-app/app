import { NextResponse } from "next/server";
import { onlyCepDigits } from "@/lib/viacep";
import { createAdminClient } from "@/lib/supabase/admin";

const LIMITS = {
  nome: 120,
  clube: 120,
  cargo: 80,
  email: 160,
  whatsapp: 30,
} as const;

type Payload = {
  nome: string;
  clube: string;
  cargo: string;
  cep: string;
  email: string;
  whatsapp: string;
};

function text(value: unknown, max: number): string {
  if (typeof value !== "string") return "";
  return value.trim().slice(0, max);
}

function readPayload(body: unknown): Payload | string {
  if (!body || typeof body !== "object") return "Preencha os dados da solicitação.";
  const raw = body as Record<string, unknown>;
  const nome = text(raw.nome, LIMITS.nome);
  const clube = text(raw.clube, LIMITS.clube);
  const cargo = text(raw.cargo, LIMITS.cargo);
  const email = text(raw.email, LIMITS.email).toLowerCase();
  const whatsapp = text(raw.whatsapp, LIMITS.whatsapp);
  const cep = onlyCepDigits(typeof raw.cep === "string" ? raw.cep : "");

  if (!nome || !clube || !cargo || !email || !whatsapp) {
    return "Preencha todos os campos.";
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return "Informe um e-mail válido.";
  }
  if (cep.length !== 8) {
    return "Informe um CEP com 8 dígitos.";
  }
  if (whatsapp.replace(/\D/g, "").length < 10) {
    return "Informe um WhatsApp com DDD.";
  }

  return { nome, clube, cargo, cep, email, whatsapp };
}

function missingTable(error: { code?: string; message?: string }): boolean {
  return error.code === "PGRST205" || (error.message ?? "").includes("landing_access_requests");
}

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Preencha os dados da solicitação." }, { status: 400 });
  }

  const payload = readPayload(body);
  if (typeof payload === "string") {
    return NextResponse.json({ error: payload }, { status: 400 });
  }

  const admin = createAdminClient();
  const { error } = await admin.from("landing_access_requests").insert(payload);
  if (error) {
    if (missingTable(error)) {
      return NextResponse.json(
        { error: "A gravação ainda não está disponível. Rode a migration 0016 no Supabase." },
        { status: 503 }
      );
    }
    return NextResponse.json({ error: "Não foi possível enviar a solicitação." }, { status: 400 });
  }

  return NextResponse.json({ ok: true });
}
