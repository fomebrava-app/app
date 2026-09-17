import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMenuItems } from "@/lib/queries";
import { PdvGate } from "./PdvGate";

// Tela pública protegida por senha — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default async function PdvTokenPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  const { token } = await params;

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("pdv_links")
    .select("label, ativo")
    .eq("token", token)
    .maybeSingle();

  if (!link) notFound();

  const items = await getMenuItems();

  return <PdvGate token={token} label={link.label} ativo={link.ativo} items={items} />;
}
