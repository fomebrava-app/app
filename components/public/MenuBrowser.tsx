"use client";

import { useMemo, useState } from "react";
import { EmptyState, SearchField, Select } from "@/components/ui";
import { MenuItemCard } from "./MenuItemCard";
import { IconBox } from "@/components/icons";
import type { MenuCategory, MenuItem } from "@/lib/types";

export function MenuBrowser({
  items,
  categories,
}: {
  items: MenuItem[];
  categories: MenuCategory[];
}) {
  const [search, setSearch] = useState("");
  const [categoriaId, setCategoriaId] = useState("");

  const filtered = useMemo(() => {
    return items.filter((item) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        item.nome.toLowerCase().includes(q) ||
        (item.descricao_curta ?? "").toLowerCase().includes(q);
      const matchCat = !categoriaId || String(item.categoria_id) === categoriaId;
      return matchSearch && matchCat;
    });
  }, [items, search, categoriaId]);

  return (
    <section id="cardapio" className="mx-auto max-w-6xl px-4 py-12 sm:px-6">
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-[24px] font-bold tracking-tight text-black">
            Cardápio
          </h2>
          <p className="mt-1 text-sm text-neutral-500">
            {filtered.length} itens disponíveis
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Buscar no cardápio..."
            className="sm:w-56"
          />
          {categories.length > 0 && (
            <Select
              value={categoriaId}
              onChange={(e) => setCategoriaId(e.target.value)}
              className="sm:w-48"
            >
              <option value="">Todas as categorias</option>
              {categories.map((c) => (
                <option key={c.id} value={String(c.id)}>
                  {c.nome}
                </option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconBox className="h-10 w-10" />}
          title="Nenhum item encontrado."
          description="Tente ajustar a busca ou selecionar outra categoria."
        />
      ) : (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filtered.map((item) => (
            <MenuItemCard key={item.id} item={item} />
          ))}
        </div>
      )}
    </section>
  );
}
