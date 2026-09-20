import { PublicHeader } from "@/components/public/PublicHeader";
import { MenuBrowser } from "@/components/public/MenuBrowser";
import { getMenuCategories, getMenuItems } from "@/lib/queries";

export default async function CardapioPage() {
  const [items, categories] = await Promise.all([
    getMenuItems(),
    getMenuCategories(),
  ]);

  const destaque = items.find((i) => i.destaque) ?? items[0];

  return (
    <div className="min-h-screen bg-brand-paper text-black">
      <PublicHeader />

      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div className="order-2 lg:order-1">
            <p className="text-[13px] uppercase tracking-widest text-neutral-500">
              Bem-vindo(a)
            </p>
            <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-black sm:text-[40px]">
              Peça direto do seu celular
            </h1>
            <p className="mt-4 max-w-md text-[15px] text-neutral-600">
              Escolha os itens, adicione ao carrinho e finalize o pagamento.
              Acompanhe o status do seu pedido em tempo real com a senha recebida no pagamento.
            </p>
          </div>
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
              {destaque?.imagem_url ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={destaque.imagem_url}
                  alt={destaque.nome}
                  className="aspect-[4/3] w-full object-cover"
                />
              ) : (
                <div className="aspect-[4/3] w-full" />
              )}
            </div>
          </div>
        </div>
      </section>

      <MenuBrowser items={items} categories={categories} />

      <footer className="border-t border-neutral-200 bg-brand-paper">
        <div className="mx-auto max-w-6xl px-4 py-8 text-center text-xs font-bold text-black sm:px-6 sm:py-10">
          Cardápio virtual do evento.
        </div>
      </footer>
    </div>
  );
}
