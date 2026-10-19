/**
 * Painel geral da plataforma, fora do menu de uma loja.
 *
 * Sem sessão, manda para `/login`. Sem ser admin geral, mostra recusa.
 * "Voltar" só existe quando o perfil tem loja e aponta para `/{slug}/admin`.
 * O brain não documenta este painel; o isolamento da loja continua em
 * brain-fomebrava/02 - Arquitetura/Multi-tenant.md e a checagem no servidor
 * segue brain-fomebrava/05 - Seguranca/Modelo de Segurança.md.
 */
import Image from "next/image";
import Link from "next/link";
import { redirect } from "next/navigation";
import { IconArrowLeft } from "@/components/icons";
import { createClient } from "@/lib/supabase/server";
import {
  isPlatformAdmin,
  listLandingAccessRequests,
  listPlatformUsers,
  signupCodeInventory,
} from "@/lib/platform-admin";
import { PlatformPanel } from "@/components/admin/PlatformPanel";
import { PlatformLogout } from "@/components/admin/PlatformLogout";
import { getUserTenantSlug } from "@/lib/user-tenant";

/**
 * Renderiza o painel geral ou a recusa de acesso.
 * Efeito: lista usuários e códigos no servidor; não grava tenant.
 * A decisão de acesso não fica no botão do menu
 * (brain-fomebrava/05 - Seguranca/Modelo de Segurança.md).
 */
export default async function PlataformaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");
  if (!isPlatformAdmin(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-black">Sem acesso a este painel</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Esta conta administra uma loja, não a plataforma.
          </p>
          <Link href="/login" className="mt-4 inline-block text-sm underline">
            Voltar ao login
          </Link>
        </div>
      </div>
    );
  }

  const [users, codes, requests, tenant] = await Promise.all([
    listPlatformUsers(),
    signupCodeInventory(),
    listLandingAccessRequests(),
    getUserTenantSlug(supabase, user.id),
  ]);

  return (
    <div className="min-h-screen bg-brand-paper text-black">
      <header className="border-b border-neutral-200">
        <div className="mx-auto flex max-w-5xl items-center justify-between px-4 py-4">
          <div className="flex items-center gap-3">
            <Image src="/logo.png" alt="Fomebrava" width={36} height={36} className="rounded-md" />
            <div>
              <p className="text-sm font-semibold">Painel geral</p>
              <p className="text-xs text-neutral-500">{user.email}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {tenant.ok && (
              <Link
                href={`/${tenant.slug}/admin`}
                className="inline-flex items-center justify-center gap-2 rounded border border-neutral-300 bg-white px-3 py-1.5 text-[13px] font-medium text-black transition-colors hover:bg-neutral-50"
              >
                <IconArrowLeft className="h-4 w-4" />
                Voltar
              </Link>
            )}
            <PlatformLogout />
          </div>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PlatformPanel users={users} codes={codes} requests={requests} />
      </main>
    </div>
  );
}
