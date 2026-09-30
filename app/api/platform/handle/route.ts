import { NextResponse } from "next/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { requirePlatformAdmin } from "@/lib/platform-admin";

function normalizeHandle(value: unknown): string | null {
  if (typeof value !== "string") return null;
  const handle = value.trim().replace(/^\$/, "");
  return handle || null;
}

export async function PATCH(request: Request) {
  const user = await requirePlatformAdmin();
  if (!user) return NextResponse.json({ error: "Sem acesso." }, { status: 403 });

  const body = (await request.json().catch(() => null)) as {
    tenantId?: unknown;
    handle?: unknown;
  } | null;
  const tenantId = typeof body?.tenantId === "string" ? body.tenantId : "";
  if (!tenantId) {
    return NextResponse.json({ error: "Loja não informada." }, { status: 400 });
  }

  const handle = normalizeHandle(body?.handle);
  const admin = createAdminClient();
  const { data, error } = await admin
    .from("tenants")
    .update({ infinitepay_handle: handle })
    .eq("id", tenantId)
    .select("id, infinitepay_handle")
    .maybeSingle();

  if (error) return NextResponse.json({ error: "Não foi possível salvar o handle." }, { status: 400 });
  if (!data) return NextResponse.json({ error: "Loja não encontrada." }, { status: 404 });

  return NextResponse.json({ handle: data.infinitepay_handle });
}
