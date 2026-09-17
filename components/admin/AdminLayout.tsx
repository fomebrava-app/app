"use client";

import { useState, type ReactNode } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
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
} from "@/components/icons";

interface NavItem {
  label: string;
  href: string;
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: "Visão geral", href: "/admin", icon: <IconDashboard className="h-5 w-5" /> },
  { label: "Itens do cardápio", href: "/admin/itens", icon: <IconBox className="h-5 w-5" /> },
  { label: "Pedidos", href: "/admin/pedidos", icon: <IconLayers className="h-5 w-5" /> },
  { label: "Financeiro", href: "/admin/financeiro", icon: <IconMoney className="h-5 w-5" /> },
  { label: "PDV", href: "/admin/pdv", icon: <IconPOS className="h-5 w-5" /> },
  { label: "Configurações", href: "/admin/configuracoes", icon: <IconSettings className="h-5 w-5" /> },
];

export function AdminLayout({
  title,
  subtitle,
  actions,
  children,
}: {
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const supabase = createClient();

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/admin/login");
    router.refresh();
  }

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b-2 border-brand-orange/30 bg-brand-yellow/10 px-5 py-4">
        <Image src="/logo.png" alt="Fomebrava" width={40} height={40} priority />
        <p className="text-[11px] uppercase tracking-widest text-black">
          Painel
        </p>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive =
            item.href === "/admin" ? pathname === "/admin" : pathname.startsWith(item.href);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className={cn(
                "flex w-full items-center gap-3 rounded border-l-2 px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "border-brand-navy bg-brand-navy/10 text-black"
                  : "border-transparent text-neutral-600 hover:bg-neutral-50 hover:text-black"
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

        <Link
          href="/"
          onClick={() => setOpen(false)}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-black"
        >
          <span className="text-black">
            <IconStore className="h-5 w-5" />
          </span>
          Cardápio público
        </Link>
        <button
          onClick={handleLogout}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-black"
        >
          <span className="text-black">
            <IconLogout className="h-5 w-5" />
          </span>
          Sair
        </button>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-brand-yellow/10 text-black">
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-neutral-200 bg-brand-yellow/10 lg:block">
        {SidebarContent}
      </aside>

      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-neutral-200 bg-brand-yellow/10">
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
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-brand-yellow/10 backdrop-blur lg:hidden">
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
            </div>
            {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
