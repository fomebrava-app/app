/**
 * Painel geral da plataforma, fora do menu de uma loja.
 *
 * Sem sessão, mostra o login deste painel. A loja do perfil não decide
 * a entrada: só o e-mail da lista PLATFORM_ADMIN_EMAILS permanece.
 * O brain não documenta este painel; o isolamento da loja continua em
 * brain-fomebrava/02 - Arquitetura/Multi-tenant.md e a checagem no servidor
 * segue brain-fomebrava/05 - Seguranca/Modelo de Segurança.md.
 */
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  isPlatformAdmin,
  listLandingAccessRequests,
  listPlatformUsers,
  signupCodeInventory,
} from "@/lib/platform-admin";
import { PlatformPanel } from "@/components/admin/PlatformPanel";
import { PlatformLogin } from "@/components/admin/PlatformLogin";
import { PlatformLogout } from "@/components/admin/PlatformLogout";

/**
 * Renderiza o login, a recusa ou o painel geral.
 * Efeito: lista usuários e códigos no servidor; não grava tenant.
 * A decisão de acesso não fica no botão do menu
 * (brain-fomebrava/05 - Seguranca/Modelo de Segurança.md).
 */
export default async function PlataformaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return <PlatformLogin />;

  if (!isPlatformAdmin(user.email)) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-brand-paper px-4">
        <div className="max-w-md text-center">
          <h1 className="text-xl font-semibold text-black">Sem acesso a este painel</h1>
          <p className="mt-2 text-sm text-neutral-500">
            Esta conta não administra o painel do sistema.
          </p>
        </div>
      </div>
    );
  }

  const [users, codes, requests] = await Promise.all([
    listPlatformUsers(),
    signupCodeInventory(),
    listLandingAccessRequests(),
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
          <PlatformLogout />
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">
        <PlatformPanel users={users} codes={codes} requests={requests} />
      </main>
    </div>
  );
}
