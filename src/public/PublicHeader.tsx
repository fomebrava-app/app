import { useState } from "react";
import { useApp } from "../store";
import { IconWatch, IconSearch, IconCart, IconMenu, IconClose } from "../components/icons";

export function PublicHeader() {
  const { navigate, cartCount } = useApp();
  const [open, setOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const links = [
    { label: "Início", action: () => navigate({ name: "landing" }) },
    {
      label: "Produtos",
      action: () => {
        navigate({ name: "landing" });
        setTimeout(() => {
          document.getElementById("produtos")?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      },
    },
    {
      label: "Contato",
      action: () => {
        navigate({ name: "landing" });
        setTimeout(() => {
          document.getElementById("contato")?.scrollIntoView({ behavior: "smooth" });
        }, 50);
      },
    },
  ];

  return (
    <header className="sticky top-0 z-30 border-b border-neutral-200 bg-white">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
        <button
          onClick={() => navigate({ name: "landing" })}
          className="flex items-center gap-2"
        >
          <IconWatch className="h-6 w-6 text-black" />
          <span className="text-lg font-bold tracking-widest text-black">EDS RELÓGIOS</span>
        </button>

        <nav className="hidden items-center gap-8 md:flex">
          {links.map((l) => (
            <button
              key={l.label}
              onClick={l.action}
              className="text-sm font-medium text-neutral-600 transition-colors hover:text-black"
            >
              {l.label}
            </button>
          ))}
        </nav>

        <div className="flex items-center gap-1">
          <button
            onClick={() => setSearchOpen((s) => !s)}
            aria-label="Buscar"
            className="rounded p-2 text-neutral-600 hover:bg-neutral-100"
          >
            <IconSearch className="h-5 w-5" />
          </button>
          <button
            onClick={() => navigate({ name: "checkout" })}
            aria-label="Carrinho"
            className="relative rounded p-2 text-neutral-600 hover:bg-neutral-100"
          >
            <IconCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-neutral-900 px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </button>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="rounded p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="border-t border-neutral-200 bg-white px-4 py-3 sm:px-6">
          <div className="mx-auto flex max-w-6xl items-center gap-2 rounded border border-neutral-300 px-3 py-2">
            <IconSearch className="h-4 w-4 text-neutral-400" />
            <input
              autoFocus
              placeholder="Buscar relógios..."
              className="w-full bg-transparent text-sm text-black placeholder:text-neutral-400 focus:outline-none"
            />
          </div>
        </div>
      )}

      {open && (
        <div className="border-t border-neutral-200 bg-white md:hidden">
          <nav className="flex flex-col px-4 py-2">
            {links.map((l) => (
              <button
                key={l.label}
                onClick={() => {
                  l.action();
                  setOpen(false);
                }}
                className="border-b border-neutral-100 py-3 text-left text-sm font-medium text-neutral-700 last:border-0 hover:text-black"
              >
                {l.label}
              </button>
            ))}
            <button
              onClick={() => {
                navigate({ name: "login" });
                setOpen(false);
              }}
              className="py-3 text-left text-sm font-medium text-neutral-500 hover:text-black"
            >
              Acesso administrativo
            </button>
          </nav>
        </div>
      )}
    </header>
  );
}
