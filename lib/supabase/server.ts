import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

// Client para Server Components / Route Handlers — respeita RLS
// com a sessão do usuário logado (ou anônima), via cookies.
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Chamado de um Server Component sem permissão de escrita de
            // cookie — o middleware.ts é responsável por renovar a sessão.
          }
        },
      },
    }
  );
}
