import { Button, Card, StatusBadge } from "../components/ui";
import { useApp } from "../store";
import { formatBRL, type Product } from "../data";

export function ProductCard({ product }: { product: Product }) {
  const { navigate, addToCart } = useApp();
  const hasPromo = !!product.precoPromocional;
  const semEstoque = product.estoque <= 0;

  return (
    <Card className="flex flex-col overflow-hidden transition-colors hover:border-neutral-400">
      <button
        onClick={() => navigate({ name: "product", id: product.id })}
        className="relative block aspect-square overflow-hidden bg-neutral-50"
      >
        <img
          src={product.imagem}
          alt={product.nome}
          className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
        />
        {hasPromo && (
          <span className="absolute left-2 top-2">
            <StatusBadge tone="strong">Promoção</StatusBadge>
          </span>
        )}
        {semEstoque && (
          <span className="absolute right-2 top-2">
            <StatusBadge tone="outline">Sem estoque</StatusBadge>
          </span>
        )}
      </button>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[12px] uppercase tracking-wide text-neutral-500">
          {product.marca} · {product.categoria}
        </p>
        <h3 className="mt-1 text-[16px] font-semibold leading-snug text-black">
          {product.nome}
        </h3>
        <p className="mt-1 line-clamp-2 text-[13px] text-neutral-500">
          {product.descricaoCurta}
        </p>

        <div className="mt-3">
          {hasPromo ? (
            <div className="flex items-baseline gap-2">
              <span className="text-[13px] text-neutral-400 line-through">
                {formatBRL(product.precoVenda)}
              </span>
              <span className="text-lg font-bold text-black">
                {formatBRL(product.precoPromocional!)}
              </span>
            </div>
          ) : (
            <span className="text-lg font-bold text-black">
              {formatBRL(product.precoVenda)}
            </span>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <Button
            className="flex-1"
            onClick={() => navigate({ name: "product", id: product.id })}
          >
            Ver detalhes
          </Button>
          <Button
            variant="primary"
            className="flex-1"
            disabled={semEstoque}
            onClick={() => {
              addToCart(product);
              navigate({ name: "checkout" });
            }}
          >
            Comprar
          </Button>
        </div>
      </div>
    </Card>
  );
}
