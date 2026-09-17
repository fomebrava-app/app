import { createClient } from "@supabase/supabase-js";

// Client com a service role key — ignora RLS. Usar SÓ em código de
// servidor confiável (webhook da InfinitePay, criação de pedido), nunca
// importar isto em um componente client.
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false } }
  );
}
