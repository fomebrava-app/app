import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  SearchField,
  Select,
  StatusBadge,
  Toast,
} from "../components/ui";
import { useApp } from "../store";
import {
  products as allProducts,
  categorias,
  formatBRL,
  stockStatus,
  type Product,
} from "../data";
import {
  IconPlus,
  IconEye,
  IconEdit,
  IconCopy,
  IconTrash,
  IconBox,
  IconStar,
} from "../components/icons";

export function Products() {
  const { navigate } = useApp();
  const [list, setList] = useState<Product[]>(allProducts);
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("");
  const [stock, setStock] = useState("");
  const [status, setStatus] = useState("");
  const [toDelete, setToDelete] = useState<Product | null>(null);
  const [toast, setToast] = useState("");

  function showToast(msg: string) {
    setToast(msg);
    setTimeout(() => setToast(""), 2500);
  }

  const filtered = useMemo(() => {
    return list.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q ||
        p.nome.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q);
      const matchCat = !cat || p.categoria === cat;
      const matchStatus = !status || p.status === status;
      const st = stockStatus(p);
      const matchStock =
        !stock ||
        (stock === "baixo" && st === "Estoque baixo") ||
        (stock === "sem" && st === "Sem estoque") ||
        (stock === "normal" && st === "Estoque normal");
      return matchSearch && matchCat && matchStatus && matchStock;
    });
  }, [list, search, cat, status, stock]);

  function handleDuplicate(p: Product) {
    const copy: Product = {
      ...p,
      id: Math.max(...list.map((x) => x.id)) + 1,
      nome: `${p.nome} (cópia)`,
      sku: `${p.sku}-CP`,
    };
    setList([copy, ...list]);
    showToast("Produto duplicado com sucesso.");
  }

  function confirmDelete() {
    if (!toDelete) return;
    setList(list.filter((p) => p.id !== toDelete.id));
    setToDelete(null);
    showToast("Produto excluído com sucesso.");
  }

  return (
    <AdminLayout
      active="products"
      title="Produtos"
      subtitle={`${filtered.length} de ${list.length} produtos exibidos`}
      actions={
        <Button variant="primary" onClick={() => navigate({ name: "product-form" })}>
          <IconPlus className="h-4 w-4" /> Cadastrar produto
        </Button>
      }
    >
      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 lg:grid-cols-4">
          <Field label="Buscar">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Nome ou SKU..."
            />
          </Field>
          <Field label="Categoria">
            <Select value={cat} onChange={(e) => setCat(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Estoque">
            <Select value={stock} onChange={(e) => setStock(e.target.value)}>
              <option value="">Todos os estoques</option>
              <option value="normal">Estoque normal</option>
              <option value="baixo">Estoque baixo</option>
              <option value="sem">Sem estoque</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)}>
              <option value="">Todos os status</option>
              <option value="Ativo">Ativo</option>
              <option value="Inativo">Inativo</option>
              <option value="Sem estoque">Sem estoque</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Table */}
      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconBox className="h-10 w-10" />}
          title="Nenhum produto encontrado."
          description="Ajuste os filtros ou cadastre um novo produto."
          action={
            <Button variant="primary" onClick={() => navigate({ name: "product-form" })}>
              <IconPlus className="h-4 w-4" /> Cadastrar produto
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[880px] text-left">
              <thead>
                <tr className="border-b border-neutral-300 text-[12px] uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Produto</th>
                  <th className="px-4 py-3 font-medium">SKU</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Preço</th>
                  <th className="px-4 py-3 font-medium">Estoque</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Destaque</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((p) => (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 text-sm last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imagem}
                          alt={p.nome}
                          className="h-10 w-10 flex-shrink-0 rounded border border-neutral-200 object-cover"
                        />
                        <span className="font-medium text-black">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.sku}</td>
                    <td className="px-4 py-3 text-neutral-600">{p.categoria}</td>
                    <td className="px-4 py-3 font-semibold text-black">
                      {formatBRL(p.precoVenda)}
                    </td>
                    <td className="px-4 py-3">
                      <span className="text-neutral-700">{p.estoque} un.</span>
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge
                        tone={
                          p.status === "Ativo"
                            ? "strong"
                            : p.status === "Inativo"
                            ? "soft"
                            : "outline"
                        }
                      >
                        {p.status}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3">
                      {p.destaque ? (
                        <span className="inline-flex items-center gap-1 text-xs text-neutral-700">
                          <IconStar className="h-4 w-4" /> Sim
                        </span>
                      ) : (
                        <span className="text-xs text-neutral-400">Não</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <IconButton
                          label="Visualizar"
                          onClick={() => navigate({ name: "product", id: p.id })}
                        >
                          <IconEye className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Editar"
                          onClick={() => navigate({ name: "product-form", id: p.id })}
                        >
                          <IconEdit className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Duplicar"
                          onClick={() => handleDuplicate(p)}
                        >
                          <IconCopy className="h-4 w-4" />
                        </IconButton>
                        <IconButton
                          label="Excluir"
                          onClick={() => setToDelete(p)}
                        >
                          <IconTrash className="h-4 w-4" />
                        </IconButton>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir produto"
        message={`Tem certeza de que deseja excluir este produto? "${toDelete?.nome}" será removido permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}

function IconButton({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded border border-transparent p-1.5 text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-black"
    >
      {children}
    </button>
  );
}
