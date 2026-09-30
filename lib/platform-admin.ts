import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import type { PlatformUser, SignupCodeInventory } from "@/lib/platform-types";

export type { PlatformUser, SignupCodeInventory };

export function isPlatformAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  const allowed = (process.env.PLATFORM_ADMIN_EMAILS ?? "")
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean);
  return allowed.includes(email.trim().toLowerCase());
}

export async function requirePlatformAdmin() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user?.email || !isPlatformAdmin(user.email)) return null;
  return user;
}

export async function listPlatformUsers(): Promise<PlatformUser[]> {
  const admin = createAdminClient();
  const emails = new Map<string, string>();

  for (let page = 1; page <= 20; page++) {
    const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const user of users) {
      if (user.email) emails.set(user.id, user.email);
    }
    if (users.length < 200) break;
  }

  const { data: profiles, error: profileError } = await admin
    .from("profiles")
    .select("id, full_name, telefone, role, tenant_id, created_at")
    .order("created_at", { ascending: false });
  if (profileError) throw profileError;

  const tenantIds = [
    ...new Set((profiles ?? []).map((profile) => profile.tenant_id).filter(Boolean)),
  ] as string[];

  const tenants = new Map<string, { slug: string; handle: string | null }>();
  if (tenantIds.length > 0) {
    const { data: rows, error: tenantError } = await admin
      .from("tenants")
      .select("id, slug, infinitepay_handle")
      .in("id", tenantIds);
    if (tenantError) throw tenantError;
    for (const row of rows ?? []) {
      tenants.set(row.id, { slug: row.slug, handle: row.infinitepay_handle });
    }
  }

  return (profiles ?? []).map((profile) => {
    const tenant = profile.tenant_id ? tenants.get(profile.tenant_id) : undefined;
    return {
      id: profile.id,
      email: emails.get(profile.id) ?? "",
      fullName: profile.full_name,
      telefone: profile.telefone,
      role: profile.role,
      createdAt: profile.created_at,
      tenantId: profile.tenant_id,
      slug: tenant?.slug ?? null,
      handle: tenant?.handle ?? null,
    };
  });
}

function missingSignupTable(error: { code?: string; message?: string } | null): boolean {
  if (!error) return false;
  return error.code === "PGRST205" || error.message.includes("signup_codes");
}

export async function signupCodeInventory(): Promise<SignupCodeInventory> {
  const admin = createAdminClient();
  // Head/count devolve 204 sem erro quando a tabela não existe. O select
  // normal devolve PGRST205, que é o sinal certo.
  const probe = await admin.from("signup_codes").select("id").limit(1);
  if (missingSignupTable(probe.error)) return { ready: false, available: 0, used: 0 };
  if (probe.error) throw probe.error;

  const { count: available, error: availableError } = await admin
    .from("signup_codes")
    .select("id", { count: "exact", head: true })
    .is("used_at", null);

  if (availableError) throw availableError;

  const { count: used, error: usedError } = await admin
    .from("signup_codes")
    .select("id", { count: "exact", head: true })
    .not("used_at", "is", null);
  if (usedError) throw usedError;

  return { ready: true, available: available ?? 0, used: used ?? 0 };
}
