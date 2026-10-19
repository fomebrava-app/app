/**
 * Casca do painel de uma loja: menu, título e conteúdo das telas admin.
 *
 * Os links ficam sob o slug da URL. O e-mail do rodapé só mostra a sessão.
 * "Painel geral" aparece se `GET /api/platform/me` responder ok; a página
 * `/plataforma` é quem autoriza de novo
 * (brain-fomebrava/01 - Produto/Gestão.md,
 * brain-fomebrava/05 - Seguranca/Modelo de Segurança.md).
 */
"use client";

import { useEffect, useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { useParams, usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/cn";
import { createClient } from "@/lib/supabase/client";
import {
  IconDashboard,
  IconBox,
  IconMoney,
  IconStore,
  IconSettings,
  IconLogout,
  IconMenu,
  IconClose,
  IconPOS,
  IconLayers,
  IconCalculator,
} from "@/components/icons";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

/**
 * Monta os atalhos do painel dessa loja.
 * @param tenant slug da URL
 * @returns itens com href em `/{tenant}/admin`
 * Não consulta outro tenant (brain-fomebrava/02 - Arquitetura/Multi-tenant.md).
 */
function buildNavItems(tenant: string): NavItem[] {
  const base = `/${tenant}/admin`;
  return [
    { label: "Visão geral", href: base, icon: <IconDashboard className="h-5 w-5" /> },
    { label: "Itens do cardápio", href: `${base}/itens`, icon: <IconBox className="h-5 w-5" /> },
    { label: "Pedidos", href: `${base}/pedidos`, icon: <IconLayers className="h-5 w-5" /> },
    { label: "Financeiro", href: `${base}/financeiro`, icon: <IconMoney className="h-5 w-5" /> },
    {
      label: "Precificação",
      href: `${base}/precificacao`,
      icon: <IconCalculator className="h-5 w-5" />,
    },
    { label: "PDV", href: `${base}/pdv`, icon: <IconPOS className="h-5 w-5" /> },
    {
      label: "Configurações",
      href: `${base}/configuracoes`,
      icon: <IconSettings className="h-5 w-5" />,
    },
  ];
}

/**
 * Desenha o menu fixo e o do celular, e a área da página.
 * @param title título da tela
 * @param subtitle linha opcional sob o título
 * @param actions botões opcionais no cabeçalho
 * @param children conteúdo da tela
 * Efeito: lê se a sessão é admin geral e qual é o e-mail, só para exibir.
 * O que o admin da loja gerencia está em brain-fomebrava/01 - Produto/Gestão.md.
 */
export function AdminLayout({
  title,
  subtitle,
  actions,
  campaignName,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  campaignName?: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant } = useParams<{ tenant: string }>();
  const [open, setOpen] = useState(false);
  const [platformAdmin, setPlatformAdmin] = useState(false);
  const [email, setEmail] = useState("");
  const [campaignLabel, setCampaignLabel] = useState("");

  useEffect(() => {
    let active = true;
    fetch("/api/platform/me")
      .then((res) => {
        if (active) setPlatformAdmin(res.ok);
      })
      .catch(() => {
        if (active) setPlatformAdmin(false);
      });
    createClient()
      .auth.getUser()
      .then(({ data }) => {
        if (active) setEmail(data.user?.email ?? "");
      })
      .catch(() => {
        if (active) setEmail("");
      });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const supabase = createClient();
    (async () => {
      try {
        const { data: store } = await supabase
          .from("tenants")
          .select("id")
          .eq("slug", tenant)
          .maybeSingle();
        if (!active || !store) return;
        const { data } = await supabase
          .from("campaigns")
          .select("nome")
          .eq("tenant_id", store.id)
          .eq("status", "aberta")
          .maybeSingle();
        if (active) setCampaignLabel(data?.nome ?? "Nenhuma campanha aberta");
      } catch {
        if (active) setCampaignLabel("");
      }
    })();
    return () => {
      active = false;
    };
  }, [tenant]);
  const supabase = createClient();
  const navItems = buildNavItems(tenant);
  const adminBase = `/${tenant}/admin`;

  /**
   * Encerra a sessão e volta para `/login`.
   * Não apaga dados da loja (brain-fomebrava/02 - Arquitetura/Autenticação e RLS.md).
   */
  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b-2 border-brand-orange/30 bg-brand-yellow/10 px-5 py-4">
        <Image
          src="/logo.png"
          alt="Fomebrava"
          width={40}
          height={40}
          priority
          className="rounded-md"
        />
        <p className="text-[11px] uppercase tracking-widest text-black">
          Painel
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === adminBase ? pathname === adminBase : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-3 rounded border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-navy bg-brand-navy/10 text-black"
                  : "border-transparent text-black hover:bg-neutral-50"
              )}
            >
              <span className="text-black">
                {item.icon}
              </span>
              {item.label}
            </Link>
          );
        })}

        <div className="my-3 border-t border-black" />

        {platformAdmin && (
          <Link
            href="/plataforma"
            onClick={() => setOpen(false)}
            className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50"
          >
            <span className="text-black">
              <IconSettings className="h-5 w-5" />
            </span>
            Painel geral
          </Link>
        )}
        <Link
          href={`/${tenant}`}
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50"
        >
          <span className="text-black">
            <IconStore className="h-5 w-5" />
          </span>
          Cardápio público
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-black transition-colors hover:bg-neutral-50"
        >
          <span className="text-black">
            <IconLogout className="h-5 w-5" />
          </span>
          Sair
        </button>
      </nav>
      {email && (
        <div className="border-t border-neutral-200 px-5 py-3">
          <p className="truncate text-xs text-neutral-500" title={email}>
            {email}
          </p>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-paper text-black" data-admin="true">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-neutral-200 bg-brand-paper lg:block">
        {SidebarContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-neutral-200 bg-brand-paper">
            <button
              onClick={() => setOpen(false)}
              aria-label="Fechar menu"
              className="absolute right-3 top-4 rounded p-1 text-neutral-500 hover:bg-neutral-100"
            >
              <IconClose className="h-5 w-5" />
            </button>
            {SidebarContent}
          </aside>
        </div>
      )}

      <div className="lg:pl-64">
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-brand-paper backdrop-blur lg:hidden">
          <div className="flex items-center justify-between gap-4 px-4 py-3">
            <button
              onClick={() => setOpen(true)}
              aria-label="Abrir menu"
              className="rounded p-2.5 text-neutral-600 hover:bg-neutral-100"
            >
              <IconMenu className="h-5 w-5" />
            </button>
          </div>
        </header>

        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-black">
                {title}
              </h1>
              {subtitle && <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>}
              {(campaignName || campaignLabel) && (
                <p className="mt-1 text-sm font-medium text-black">
                  Campanha: {campaignName || campaignLabel}
                </p>
              )}
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
