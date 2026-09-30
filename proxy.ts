import { type NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { getUserTenantSlug } from "@/lib/user-tenant";

// Protege /[tenant]/admin/** (painel). A loja pública, a cozinha e o
// acompanhamento do cliente são deliberadamente públicos: a validação de
// tenant nessas rotas acontece na própria página (404 se o slug não
// existir em `tenants`), não aqui.
//
// Aqui, além de exigir sessão, exigimos que o tenant_id do usuário
// logado bata com o slug da URL — sem isso, o admin do tenant A
// conseguiria acessar /[tenant-b]/admin trocando a URL manualmente.
export async function proxy(request: NextRequest) {
  const segments = request.nextUrl.pathname.split("/").filter(Boolean);
  const [tenantSlug, section] = segments;

  if (!tenantSlug || tenantSlug === "login" || section !== "admin") {
    return NextResponse.next();
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  const tenant = await getUserTenantSlug(supabase, user.id);

  if (!tenant.ok || tenant.slug !== tenantSlug) {
    if (!tenant.ok && tenant.reason === "query_error") {
      console.error("proxy: falha ao ler a loja do perfil");
    }
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // "api/" e não "api": senão um slug como apiario deixa o /admin sem login.
  matcher: ["/((?!_next/static|_next/image|favicon.ico|api/).*)"],
};
