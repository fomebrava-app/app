import type { SupabaseClient } from "@supabase/supabase-js";

// Resolve a loja do usuário logado a partir de profiles.tenant_id.
// O embed tenants(slug) não serve aqui: a relação é muitos-para-um e o
// PostgREST devolve um objeto, não uma lista. Quem lia [0] ficava sem slug
// mesmo com o vínculo certo. O slug sai só desse tenant_id — nunca da URL.
export type UserTenantSlug =
  | { ok: true; slug: string }
  | { ok: false; reason: "no_tenant" | "query_error" };

export async function getUserTenantSlug(
  supabase: SupabaseClient,
  userId: string
): Promise<UserTenantSlug> {
  const { data: profile, error: profileError } = await supabase
    .from("profiles")
    .select("tenant_id")
    .eq("id", userId)
    .maybeSingle();

  if (profileError) return { ok: false, reason: "query_error" };

  const tenantId = profile?.tenant_id;
  if (!tenantId) return { ok: false, reason: "no_tenant" };

  const { data: tenant, error: tenantError } = await supabase
    .from("tenants")
    .select("slug")
    .eq("id", tenantId)
    .maybeSingle();

  if (tenantError) return { ok: false, reason: "query_error" };
  if (!tenant?.slug) return { ok: false, reason: "no_tenant" };

  return { ok: true, slug: tenant.slug };
}
