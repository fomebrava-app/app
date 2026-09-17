"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Card, EmptyState, Toggle } from "@/components/ui";
import { IconBox, IconEdit } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/format";
import type { MenuCategory, MenuItem } from "@/lib/types";

export function ItensTable({
  items,
  categories,
}: {
  items: MenuItem[];
  categories: MenuCategory[];
}) {
  const router = useRouter();
  const supabase = createClient();
  const [pending, setPending] = useState<string | null>(null);

  const categoriaNome = (id: number | null) =>
    categories.find((c) => c.id === id)?.nome ?? "—";

  async function toggleDisponivel(item: MenuItem) {
    setPending(item.id);
    const novoStatus = item.status === "disponivel" ? "esgotado" : "disponivel";
    await supabase.from("menu_items").update({ status: novoStatus }).eq("id", item.id);
    setPending(null);
    router.refresh();
  }

  if (items.length === 0) {
    return (
      <EmptyState
        icon={<IconBox className="h-10 w-10" />}
        title="Nenhum item cadastrado."
        description="Cadastre o primeiro item do cardápio."
      />
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
            <tr>
              <th className="px-4 py-3 font-medium">Item</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Disponível</th>
              <th className="px-4 py-3 font-medium">Status</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-neutral-100">
            {items.map((item) => (
              <tr key={item.id}>
                <td className="flex items-center gap-3 px-4 py-3">
                  {item.imagem_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imagem_url}
                      alt={item.nome}
                      className="h-9 w-9 flex-shrink-0 rounded border border-neutral-200 object-cover"
                    />
                  ) : (
                    <div className="h-9 w-9 flex-shrink-0 rounded border border-neutral-200 bg-neutral-50" />
                  )}
                  <span className="font-medium text-black">{item.nome}</span>
                </td>
                <td className="px-4 py-3 text-neutral-600">{categoriaNome(item.categoria_id)}</td>
                <td className="px-4 py-3 font-medium text-black">
                  {formatBRL(item.preco_promocional ?? item.preco)}
                </td>
                <td className="px-4 py-3">
                  <Toggle
                    checked={item.status === "disponivel"}
                    onChange={() => toggleDisponivel(item)}
                  />
                </td>
                <td className="px-4 py-3 text-neutral-600">
                  {item.status === "inativo" ? "Inativo" : pending === item.id ? "..." : ""}
                </td>
                <td className="px-4 py-3 text-right">
                  <Link
                    href={`/admin/itens/${item.id}`}
                    className="inline-flex items-center gap-1 text-neutral-500 hover:text-black"
                  >
                    <IconEdit className="h-4 w-4" /> Editar
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
