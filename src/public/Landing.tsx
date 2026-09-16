import { useMemo, useState } from "react";
import { PublicHeader } from "./PublicHeader";
import { ProductCard } from "./ProductCard";
import { Button, EmptyState, SearchField, Select } from "../components/ui";
import { useApp } from "../store";
import { products, categorias } from "../data";
import { IconArrowRight, IconWatch, IconBox } from "../components/icons";

export function Landing() {
  const { navigate } = useApp();
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");

  const visible = products.filter((p) => p.exibirLoja);

  const filtered = useMemo(() => {
    return visible.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.descricaoCurta.toLowerCase().includes(q);
      const matchCat = !cat || p.categoria === cat;
      return matchSearch && matchCat;
    });
  }, [visible, search, cat]);

  const hero = products.find((p) => p.destaque) ?? products[0];

  return (
    <div className="min-h-screen bg-white text-black">
      <PublicHeader />

      {/* Hero */}
      <section className="border-b border-neutral-200">
        <div className="mx-auto grid max-w-6xl grid-cols-1 items-center gap-8 px-4 py-12 sm:px-6 lg:grid-cols-2 lg:py-16">
          <div className="order-2 lg:order-1">
            <p className="text-[13px] uppercase tracking-widest text-neutral-500">
              Coleção 2026
            </p>
            <h1 className="mt-3 text-[32px] font-bold leading-tight tracking-tight text-black sm:text-[40px]">
              Relógios para todos os momentos
            </h1>
            <p className="mt-4 max-w-md text-[15px] text-neutral-600">
              Encontre modelos selecionados com estilo, qualidade e personalidade.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Button
                variant="primary"
                onClick={() =>
                  document
                    .getElementById("produtos")
                    ?.scrollIntoView({ behavior: "smooth" })
                }
              >
                Ver produtos <IconArrowRight className="h-4 w-4" />
              </Button>
              <Button onClick={() => navigate({ name: "product", id: hero.id })}>
                Modelo em destaque
              </Button>
            </div>
          </div>
          <div className="order-1 lg:order-2">
            <div className="overflow-hidden rounded-md border border-neutral-200 bg-neutral-50">
              <img
                src={hero.imagem}
                alt={hero.nome}
                className="aspect-[4/3] w-full object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Storefront */}
      <section id="produtos" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-[24px] font-bold tracking-tight text-black">
              Nossos relógios
            </h2>
            <p className="mt-1 text-sm text-neutral-500">
              {filtered.length} modelo(s) disponível(is)
            </p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Buscar relógios..."
              className="sm:w-56"
            />
            <Select
              value={cat}
              onChange={(e) => setCat(e.target.value)}
              className="sm:w-48"
            >
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </div>
        </div>

        {filtered.length === 0 ? (
          <EmptyState
            icon={<IconBox className="h-10 w-10" />}
            title="Nenhum produto encontrado."
            description="Tente ajustar a busca ou selecionar outra categoria."
          />
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {filtered.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Contact / footer */}
      <footer id="contato" className="border-t border-neutral-200 bg-neutral-50">
        <div className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            <div>
              <div className="flex items-center gap-2">
                <IconWatch className="h-6 w-6 text-black" />
                <span className="text-lg font-bold tracking-widest text-black">
                  EDS RELÓGIOS
                </span>
              </div>
              <p className="mt-3 max-w-xs text-sm text-neutral-500">
                Relógios selecionados com estilo, qualidade e personalidade para
                todos os momentos.
              </p>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">Contato</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>contato@edsrelogios.com.br</li>
                <li>(11) 3000-0000</li>
                <li>Segunda a sexta, 9h às 18h</li>
              </ul>
            </div>
            <div>
              <p className="text-sm font-semibold text-black">Institucional</p>
              <ul className="mt-3 space-y-2 text-sm text-neutral-600">
                <li>
                  <button
                    onClick={() => navigate({ name: "login" })}
                    className="hover:text-black"
                  >
                    Acesso administrativo
                  </button>
                </li>
                <li>Trocas e devoluções</li>
                <li>Política de privacidade</li>
              </ul>
            </div>
          </div>
          <div className="mt-10 border-t border-neutral-200 pt-6 text-center text-xs text-neutral-400">
            © 2026 EDS Relógios. Protótipo demonstrativo — todos os dados são
            fictícios.
          </div>
        </div>
      </footer>
    </div>
  );
}
