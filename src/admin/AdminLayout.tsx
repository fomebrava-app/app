import { useState, type ReactNode } from "react";
import { cn } from "../utils/cn";
import { useApp, type Route } from "../store";
import {
  IconDashboard,
  IconBox,
  IconLayers,
  IconMoney,
  IconUsers,
  IconStore,
  IconSettings,
  IconLogout,
  IconMenu,
  IconClose,
  IconWatch,
  IconBell,
  IconSearch,
  IconPOS,
} from "../components/icons";

interface NavItem {
  label: string;
  route: Route["name"];
  icon: ReactNode;
}

const navItems: NavItem[] = [
  { label: "Visão geral", route: "overview", icon: <IconDashboard className="h-5 w-5" /> },
  { label: "Produtos", route: "products", icon: <IconBox className="h-5 w-5" /> },
  { label: "Estoque", route: "inventory", icon: <IconLayers className="h-5 w-5" /> },
  { label: "Financeiro", route: "finance", icon: <IconMoney className="h-5 w-5" /> },
  { label: "Clientes", route: "customers", icon: <IconUsers className="h-5 w-5" /> },
  { label: "PDV", route: "pdv", icon: <IconPOS className="h-5 w-5" /> },
  { label: "Configurações", route: "settings", icon: <IconSettings className="h-5 w-5" /> },
];

export function AdminLayout({
  active,
  title,
  subtitle,
  actions,
  children,
}: {
  active: Route["name"];
  title: string;
  subtitle?: string;
  actions?: ReactNode;
  children: ReactNode;
}) {
  const { navigate } = useApp();
  const [open, setOpen] = useState(false);

  const SidebarContent = (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-2 border-b border-neutral-200 px-5 py-5">
        <IconWatch className="h-6 w-6 text-black" />
        <div className="leading-tight">
          <p className="text-base font-bold tracking-tight text-black">EDS RELÓGIOS</p>
          <p className="text-[11px] uppercase tracking-widest text-neutral-500">
            Painel
          </p>
        </div>
      </div>

      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-4">
        {navItems.map((item) => {
          const isActive = active === item.route;
          return (
            <button
              key={item.route}
              onClick={() => {
                navigate({ name: item.route } as Route);
                setOpen(false);
              }}
              className={cn(
                "flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium transition-colors",
                isActive
                  ? "bg-neutral-100 text-black"
                  : "text-neutral-600 hover:bg-neutral-50 hover:text-black"
              )}
            >
              <span className={isActive ? "text-black" : "text-neutral-400"}>
                {item.icon}
              </span>
              {item.label}
            </button>
          );
        })}

        <div className="my-3 border-t border-neutral-200" />

        <button
          onClick={() => {
            navigate({ name: "landing" });
            setOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-black"
        >
          <span className="text-neutral-400">
            <IconStore className="h-5 w-5" />
          </span>
          Loja virtual
        </button>
        <button
          onClick={() => {
            navigate({ name: "login" });
            setOpen(false);
          }}
          className="flex w-full items-center gap-3 rounded px-3 py-2.5 text-sm font-medium text-neutral-600 transition-colors hover:bg-neutral-50 hover:text-black"
        >
          <span className="text-neutral-400">
            <IconLogout className="h-5 w-5" />
          </span>
          Sair
        </button>
      </nav>
    </div>
  );

  return (
    <div className="min-h-screen bg-white text-black">
      {/* Desktop sidebar */}
      <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 border-r border-neutral-200 bg-white lg:block">
        {SidebarContent}
      </aside>

      {/* Mobile drawer */}
      {open && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/40"
            onClick={() => setOpen(false)}
          />
          <aside className="absolute inset-y-0 left-0 w-64 border-r border-neutral-200 bg-white">
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
        {/* Header */}
        <header className="sticky top-0 z-20 border-b border-neutral-200 bg-white/90 backdrop-blur">
          <div className="flex items-center justify-between gap-4 px-4 py-3 sm:px-6">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setOpen(true)}
                aria-label="Abrir menu"
                className="rounded p-2 text-neutral-600 hover:bg-neutral-100 lg:hidden"
              >
                <IconMenu className="h-5 w-5" />
              </button>
              <div className="hidden items-center gap-2 rounded border border-neutral-300 px-3 py-1.5 md:flex">
                <IconSearch className="h-4 w-4 text-neutral-400" />
                <input
                  placeholder="Buscar no painel..."
                  className="w-44 bg-transparent text-sm text-black placeholder:text-neutral-400 focus:outline-none"
                />
              </div>
            </div>
            <div className="flex items-center gap-3">
              <button
                aria-label="Notificações"
                className="rounded p-2 text-neutral-600 hover:bg-neutral-100"
              >
                <IconBell className="h-5 w-5" />
              </button>
              <div className="flex items-center gap-2 border-l border-neutral-200 pl-3">
                <div className="flex h-8 w-8 items-center justify-center rounded-full border border-neutral-300 text-xs font-semibold text-neutral-700">
                  AD
                </div>
                <div className="hidden leading-tight sm:block">
                  <p className="text-sm font-medium text-black">Administrador</p>
                  <p className="text-[11px] text-neutral-500">admin@edsrelogios.com.br</p>
                </div>
              </div>
            </div>
          </div>
        </header>

        {/* Page header + content */}
        <main className="px-4 py-6 sm:px-6 lg:px-8">
          <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-[28px] font-bold leading-tight tracking-tight text-black">
                {title}
              </h1>
              {subtitle && (
                <p className="mt-1 text-sm text-neutral-500">{subtitle}</p>
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
