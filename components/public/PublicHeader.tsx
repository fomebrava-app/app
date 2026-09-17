"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import { useCart } from "@/lib/cart-context";
import { IconCart, IconMenu, IconClose } from "@/components/icons";

export function PublicHeader() {
  const { cartCount } = useCart();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 border-b-2 border-brand-orange/30 bg-brand-red/30">
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
          <Link
            href="/carrinho"
            aria-label="Carrinho"
            className="relative rounded p-2 text-neutral-600 hover:bg-neutral-100"
          >
            <IconCart className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-red px-1 text-[10px] font-semibold text-white">
                {cartCount}
              </span>
            )}
          </Link>
          <button
            onClick={() => setOpen((o) => !o)}
            aria-label="Menu"
            className="rounded p-2 text-neutral-600 hover:bg-neutral-100 md:hidden"
          >
            {open ? <IconClose className="h-5 w-5" /> : <IconMenu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="border-t border-neutral-200 bg-brand-red/30 md:hidden">
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
    </header>
  );
}
