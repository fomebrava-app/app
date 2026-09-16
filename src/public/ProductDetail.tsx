import { useState } from "react";
import { PublicHeader } from "./PublicHeader";
import { Button, Card, StatusBadge } from "../components/ui";
import { useApp } from "../store";
import { products, formatBRL, stockStatus } from "../data";
import { IconArrowLeft, IconCart } from "../components/icons";

export function ProductDetail({ id }: { id: number }) {
  const { navigate, addToCart } = useApp();
  const product = products.find((p) => p.id === id);
  const [qty, setQty] = useState(1);
  const [activeImg, setActiveImg] = useState(0);

  if (!product) {
    return (
      <div className="min-h-screen bg-white">
        <PublicHeader />
        <div className="mx-auto max-w-6xl px-4 py-20 text-center">
          <p className="text-lg font-semibold text-black">Produto não encontrado.</p>
          <Button className="mt-4" onClick={() => navigate({ name: "landing" })}>
            Voltar para a loja
          </Button>
        </div>
      </div>
    );
  }

  const gallery = [
    product.imagem,
    "https://images.unsplash.com/photo-1434056886845-dac89ffe9b56?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1508057198894-247b23fe5ade?auto=format&fit=crop&w=600&q=80",
    "https://images.unsplash.com/photo-1524592094714-0f0654e20314?auto=format&fit=crop&w=600&q=80",
  ];

  const hasPromo = !!product.precoPromocional;
  const st = stockStatus(product);
  const semEstoque = product.estoque <= 0;

  const tecnica = [
    { label: "Material da caixa", value: product.tecnica.caixa },
    { label: "Material da pulseira", value: product.tecnica.pulseira },
    { label: "Tipo de mecanismo", value: product.tecnica.mecanismo },
    { label: "Resistência à água", value: product.tecnica.resistencia },
    { label: "Garantia", value: product.tecnica.garantia },
  ];

  return (
    <div className="min-h-screen bg-white text-black">
      <PublicHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate({ name: "landing" })}
          className="mb-6 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" /> Voltar para produtos
        </button>

        <div className="grid grid-cols-1 gap-8 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
              <img
                src={gallery[activeImg]}
                alt={product.nome}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="mt-3 grid grid-cols-4 gap-3">
              {gallery.map((src, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveImg(idx)}
                  className={`overflow-hidden rounded border ${
                    activeImg === idx ? "border-neutral-700" : "border-neutral-200"
                  }`}
                >
                  <img
                    src={src}
                    alt={`Miniatura ${idx + 1}`}
                    className="aspect-square w-full object-cover"
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Info */}
          <div>
            <p className="text-[13px] uppercase tracking-widest text-neutral-500">
              {product.marca} · {product.modelo}
            </p>
            <h1 className="mt-2 text-[28px] font-bold leading-tight tracking-tight text-black">
              {product.nome}
            </h1>

            <div className="mt-3 flex items-center gap-2">
              <StatusBadge
                tone={
                  st === "Estoque normal"
                    ? "soft"
                    : st === "Estoque baixo"
                    ? "medium"
                    : "outline"
                }
              >
                {st}
              </StatusBadge>
              {!semEstoque && (
                <span className="text-sm text-neutral-500">
                  {product.estoque} unidade(s) disponível(is)
                </span>
              )}
            </div>

            <div className="mt-5">
              {hasPromo ? (
                <div className="flex items-baseline gap-3">
                  <span className="text-base text-neutral-400 line-through">
                    {formatBRL(product.precoVenda)}
                  </span>
                  <span className="text-[32px] font-bold leading-none text-black">
                    {formatBRL(product.precoPromocional!)}
                  </span>
                </div>
              ) : (
                <span className="text-[32px] font-bold leading-none text-black">
                  {formatBRL(product.precoVenda)}
                </span>
              )}
              <p className="mt-2 text-sm text-neutral-500">
                Em até 10x sem juros no cartão.
              </p>
            </div>

            <p className="mt-5 text-[15px] text-neutral-700">
              {product.descricaoCurta}
            </p>

            {/* Quantity + buy */}
            <div className="mt-6 flex flex-wrap items-center gap-3">
              <div className="flex items-center rounded border border-neutral-300">
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="px-3 py-2 text-neutral-600 hover:text-black"
                  aria-label="Diminuir"
                >
                  −
                </button>
                <span className="w-10 text-center text-sm font-medium">{qty}</span>
                <button
                  onClick={() =>
                    setQty((q) => Math.min(product.estoque || 99, q + 1))
                  }
                  className="px-3 py-2 text-neutral-600 hover:text-black"
                  aria-label="Aumentar"
                >
                  +
                </button>
              </div>
              <Button
                variant="primary"
                disabled={semEstoque}
                className="flex-1 sm:flex-none"
                onClick={() => {
                  addToCart(product, qty);
                  navigate({ name: "checkout" });
                }}
              >
                <IconCart className="h-4 w-4" /> Comprar agora
              </Button>
            </div>

            {/* Full description */}
            <div className="mt-8 border-t border-neutral-200 pt-6">
              <h2 className="text-lg font-semibold text-black">Descrição</h2>
              <p className="mt-2 text-[15px] leading-relaxed text-neutral-700">
                {product.descricaoCompleta}
              </p>
            </div>
          </div>
        </div>

        {/* Technical info */}
        <div className="mt-12">
          <h2 className="text-xl font-semibold text-black">
            Informações técnicas
          </h2>
          <Card className="mt-4 overflow-hidden">
            <dl className="divide-y divide-neutral-100">
              {tecnica.map((t) => (
                <div
                  key={t.label}
                  className="flex items-center justify-between gap-4 px-5 py-3.5"
                >
                  <dt className="text-sm text-neutral-500">{t.label}</dt>
                  <dd className="text-sm font-medium text-black">{t.value}</dd>
                </div>
              ))}
            </dl>
          </Card>
        </div>
      </div>
    </div>
  );
}
