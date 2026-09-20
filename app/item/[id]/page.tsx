import Link from "next/link";
import { notFound } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { AddToCartControl } from "@/components/public/AddToCartControl";
import { StatusBadge } from "@/components/ui";
import { IconArrowLeft } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import { getMenuItemById } from "@/lib/queries";

export default async function ItemPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getMenuItemById(id);

  if (!item || item.status === "inativo") {
    notFound();
  }

  const hasPromo = !!item.preco_promocional;
  const esgotado = item.status === "esgotado";

  return (
    <div className="min-h-screen bg-brand-paper text-black">
      <PublicHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <Link
          href="/"
          className="mb-6 flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" /> Voltar para o cardápio
        </Link>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
            {item.imagem_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={item.imagem_url}
                alt={item.nome}
                className="aspect-square w-full object-cover"
              />
            ) : (
              <div className="flex aspect-square w-full items-center justify-center text-neutral-300">
                Sem foto
              </div>
            )}
          </div>

          <div>
            <h1 className="text-[28px] font-bold leading-tight tracking-tight text-black">
              {item.nome}
            </h1>

            {esgotado && (
              <div className="mt-3">
                <StatusBadge tone="outline" className="bg-brand-red/10 border-brand-red/40">
                  Esgotado
                </StatusBadge>
              </div>
            )}

            <div className="mt-5">
              {hasPromo ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-base text-neutral-400 line-through">
                    {formatBRL(item.preco)}
                  </span>
                  <span className="text-[32px] font-bold leading-none text-black">
                    {formatBRL(item.preco_promocional!)}
                  </span>
                </div>
              ) : (
                <span className="text-[32px] font-bold leading-none text-black">
                  {formatBRL(item.preco)}
                </span>
              )}
            </div>

            {item.descricao_curta && (
              <p className="mt-5 text-[15px] text-neutral-700">
                {item.descricao_curta}
              </p>
            )}

            <AddToCartControl item={item} />

            {item.descricao_completa && (
              <div className="mt-8 border-t border-neutral-200 pt-6">
                <h2 className="text-lg font-semibold text-black">Descrição</h2>
                <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
                  {item.descricao_completa}
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
