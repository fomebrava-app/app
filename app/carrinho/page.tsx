"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button, Card, EmptyState } from "@/components/ui";
import { IconArrowLeft, IconCart, IconTrash } from "@/components/icons";
import { useCart } from "@/lib/cart-context";
import { formatBRL } from "@/lib/format";

export default function CarrinhoPage() {
  const { cart, updateQuantity, removeFromCart, cartTotal } = useCart();
  const router = useRouter();

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-brand-paper text-black">
        <PublicHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={<IconCart className="h-10 w-10" />}
            title="Seu carrinho está vazio."
            description="Adicione itens do cardápio para continuar com o pedido."
            action={
              <Link href="/">
                <Button variant="primary">Ver cardápio</Button>
              </Link>
            }
          />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper text-black">
      <PublicHeader />

      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-4 flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" /> Continuar escolhendo
        </Link>
        <h1 className="text-[28px] font-bold tracking-tight text-black">
          Seu carrinho
        </h1>

        <Card className="mt-6 divide-y divide-neutral-100">
          {cart.map((item) => {
            const unit = item.menuItem.preco_promocional ?? item.menuItem.preco;
            return (
              <div key={item.menuItem.id} className="flex gap-3 p-4">
                {item.menuItem.imagem_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={item.menuItem.imagem_url}
                    alt={item.menuItem.nome}
                    className="h-16 w-16 flex-shrink-0 rounded border border-neutral-200 object-cover"
                  />
                ) : (
                  <div className="h-16 w-16 flex-shrink-0 rounded border border-neutral-200 bg-neutral-50" />
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-black">
                    {item.menuItem.nome}
                  </p>
                  <p className="text-xs text-neutral-500">{formatBRL(unit)} / un.</p>

                  <div className="mt-2 flex items-center justify-between">
                    <div className="flex items-center rounded border border-neutral-300">
                      <button
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantidade - 1)
                        }
                        className="px-2.5 py-1 text-neutral-600 hover:text-black"
                        aria-label="Diminuir"
                      >
                        −
                      </button>
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantidade}
                      </span>
                      <button
                        onClick={() =>
                          updateQuantity(item.menuItem.id, item.quantidade + 1)
                        }
                        className="px-2.5 py-1 text-neutral-600 hover:text-black"
                        aria-label="Aumentar"
                      >
                        +
                      </button>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-semibold text-black">
                        {formatBRL(unit * item.quantidade)}
                      </span>
                      <button
                        onClick={() => removeFromCart(item.menuItem.id)}
                        aria-label="Remover"
                        className="text-neutral-400 hover:text-black"
                      >
                        <IconTrash className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Card>

        <div className="mt-5 flex items-center justify-between border-t border-neutral-200 pt-4">
          <span className="text-base font-semibold text-black">Total</span>
          <span className="text-2xl font-bold text-black">
            {formatBRL(cartTotal)}
          </span>
        </div>

        <Button
          variant="primary"
          className="mt-5 w-full"
          onClick={() => router.push("/checkout")}
        >
          Finalizar pedido
        </Button>
      </div>
    </div>
  );
}
