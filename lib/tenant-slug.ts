// O "usuário" do cadastro é o slug da loja. A normalização tira acento
// antes de descartar o resto, para "clubeá" virar "clubea" e não "clube".
export const RESERVED_TENANT_SLUGS = new Set(["login", "api", "fonts", "plataforma"]);

const SLUG_PATTERN = /^[a-z0-9][a-z0-9-]{1,48}[a-z0-9]$/;

export function normalizeTenantSlugInput(input: string): string {
  return input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .slice(0, 50);
}

export function normalizeTenantSlug(input: string): string {
  return normalizeTenantSlugInput(input)
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isValidTenantSlug(slug: string): boolean {
  return SLUG_PATTERN.test(slug) && !RESERVED_TENANT_SLUGS.has(slug);
}
