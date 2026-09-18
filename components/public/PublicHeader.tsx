"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { IconCart, IconMenu, IconClose } from "@/components/icons";

export function PublicHeader() {
  const { cartCount } = useCart();
  const [open, setOpen] = useState(false);
  const pathname = usePathname();

  return (
    <>
      <header className="sticky top-0 z-30 border-b-2 border-brand-orange/30 bg-brand-yellow/100">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-4 sm:px-6">
          <Link href="/" className="flex items-center gap-2">
            <Image src="/logo.png" alt="Fomebrava" width={48} height={48} priority />
          </Link>

          <nav className="hidden items-center gap-8 md:flex">
            <Link
              href="/"
              className="text-sm font-bold text-black transition-colors hover:text-neutral-700"
            >
              Cardápio
            </Link>
            <Link
              href="/pedido"
              className="text-sm font-bold text-black transition-colors hover:text-neutral-700"
            >
              Acompanhar pedido
            </Link>
          </nav>

          <div className="flex items-center gap-1">
            <button
              onClick={() => setOpen((o) => !o)}
              aria-label="Menu"
              className="rounded p-2.5 text-neutral-600 hover:bg-neutral-100 md:hidden"
            >
              {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="border-t border-neutral-200 bg-brand-yellow/100 md:hidden">
            <nav className="flex flex-col px-4 py-2">
              <Link
                href="/"
                onClick={() => setOpen(false)}
                className="border-b border-neutral-100 py-3 text-left text-sm font-bold text-black hover:text-neutral-700"
              >
                Cardápio
              </Link>
              <Link
                href="/pedido"
                onClick={() => setOpen(false)}
                className="py-3 text-left text-sm font-bold text-black hover:text-neutral-700"
              >
                Acompanhar pedido
              </Link>
            </nav>
          </div>
        )}

        {/* Some antes do conteúdo rolado "tocar" no header — sem isso, o
            fundo translúcido do header (bg-brand-yellow/10) deixa o
            conteúdo por trás quase totalmente visível por baixo do logo/
            nav enquanto rola. A cor sólida abaixo é o mesmo tom já
            renderizado nas páginas (bg-brand-yellow/10 sobre fundo
            branco), então o degradê se funde com o corpo da página. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-x-0 top-full h-10 bg-gradient-to-b from-[#fffbe8] to-transparent"
        />
      </header>

      {cartCount > 0 && pathname !== "/carrinho" && (
        <Link
          href="/carrinho"
          aria-label="Ver carrinho"
          className="fixed bottom-5 right-4 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform hover:scale-105 sm:right-6"
        >
          <IconCart className="h-6 w-6" />
          <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-red px-1 text-[11px] font-semibold text-white ring-2 ring-white">
            {cartCount}
          </span>
        </Link>
      )}
    </>
  );
}
