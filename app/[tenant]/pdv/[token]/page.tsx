import { notFound } from "next/navigation";
import { createAdminClient } from "@/lib/supabase/admin";
import { getMenuCustomizations, getMenuItems, getOpenCampaign, getTenantBySlug } from "@/lib/queries";
import { PdvGate } from "./PdvGate";

// Tela pública protegida por senha — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default async function PdvTokenPage({
  params,
}: {
  params: Promise<{ tenant: string; token: string }>;
}) {
  const { tenant: tenantSlug, token } = await params;
  const tenant = await getTenantBySlug(tenantSlug);
  if (!tenant) notFound();

  const admin = createAdminClient();
  const { data: link } = await admin
    .from("pdv_links")
    .select("label, ativo, tenant_id")
    .eq("token", token)
    .maybeSingle();

  if (!link || link.tenant_id !== tenant.id) notFound();

  const [items, customizations, openCampaign] = await Promise.all([
    getMenuItems(tenant.id),
    getMenuCustomizations(tenant.id),
    getOpenCampaign(tenant.id),
  ]);

  return (
    <PdvGate
      tenant={tenantSlug}
      token={token}
      label={link.label}
      ativo={link.ativo}
      items={items}
      customizations={customizations}
      campaignOpen={!!openCampaign}
      pixChave={openCampaign?.recebimento === "pix" ? openCampaign.pix_chave : null}
    />
  );
}
