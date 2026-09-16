import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  SearchField,
  Select,
  StatusBadge,
  Textarea,
  Toast,
} from "../components/ui";
import {
  products,
  categorias,
  inventoryMovements as initialMovements,
  stockStatus,
  type MovementType,
} from "../data";
import { IconPlus, IconAlert } from "../components/icons";

function stockTone(s: string) {
  if (s === "Estoque normal") return "soft" as const;
  if (s === "Estoque baixo") return "medium" as const;
  return "outline" as const;
}

export function Inventory() {
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [movements, setMovements] = useState(initialMovements);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    produto: "",
    tipo: "Entrada" as MovementType,
    quantidade: "",
    motivo: "",
    observacao: "",
    data: "02/08/2026",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return products.filter((p) => {
      const q = search.toLowerCase();
      const matchSearch =
        !q || p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q);
      const st = stockStatus(p);
      const matchStatus = !statusFilter || st === statusFilter;
      const matchCat = !catFilter || p.categoria === catFilter;
      return matchSearch && matchStatus && matchCat;
    });
  }, [search, statusFilter, catFilter]);

  const lowStockCount = products.filter(
    (p) => stockStatus(p) === "Estoque baixo"
  ).length;

  function handleRegister() {
    const req: Record<string, boolean> = {};
    if (!form.produto) req.produto = true;
    if (!form.quantidade) req.quantidade = true;
    if (!form.motivo) req.motivo = true;
    setErrors(req);
    if (Object.keys(req).length > 0) return;

    const newMov = {
      id: Math.max(...movements.map((m) => m.id)) + 1,
      data: form.data,
      produto: form.produto,
      tipo: form.tipo,
      quantidade:
        form.tipo === "Saída"
          ? -Math.abs(Number(form.quantidade))
          : Number(form.quantidade),
      motivo: form.motivo,
    };
    setMovements([newMov, ...movements]);
    setModalOpen(false);
    setForm({
      produto: "",
      tipo: "Entrada",
      quantidade: "",
      motivo: "",
      observacao: "",
      data: "02/08/2026",
    });
    setErrors({});
    setToast("Movimentação registrada com sucesso.");
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <AdminLayout
      active="inventory"
      title="Controle de estoque"
      subtitle="Acompanhe os níveis de estoque e registre movimentações."
      actions={
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <IconPlus className="h-4 w-4" /> Registrar movimentação
        </Button>
      }
    >
      {lowStockCount > 0 && (
        <div className="mb-5 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-4 py-3 text-sm text-neutral-700">
          <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
          {lowStockCount} produto(s) estão com estoque baixo. Este produto está com
          estoque baixo e precisa de reposição.
        </div>
      )}

      {/* Filters */}
      <Card className="mb-5 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Buscar">
            <SearchField
              value={search}
              onChange={setSearch}
              placeholder="Nome ou SKU..."
            />
          </Field>
          <Field label="Status do estoque">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="Estoque normal">Estoque normal</option>
              <option value="Estoque baixo">Estoque baixo</option>
              <option value="Sem estoque">Sem estoque</option>
            </Select>
          </Field>
          <Field label="Categoria">
            <Select value={catFilter} onChange={(e) => setCatFilter(e.target.value)}>
              <option value="">Todas as categorias</option>
              {categorias.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </Card>

      {/* Stock table */}
      <Card className="mb-6 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[780px] text-left">
            <thead>
              <tr className="border-b border-neutral-300 text-[12px] uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">SKU</th>
                <th className="px-4 py-3 font-medium">Estoque atual</th>
                <th className="px-4 py-3 font-medium">Estoque mínimo</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="px-4 py-3 font-medium">Atualização</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => {
                const st = stockStatus(p);
                return (
                  <tr
                    key={p.id}
                    className="border-b border-neutral-100 text-sm last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.imagem}
                          alt={p.nome}
                          className="h-9 w-9 flex-shrink-0 rounded border border-neutral-200 object-cover"
                        />
                        <span className="font-medium text-black">{p.nome}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.sku}</td>
                    <td className="px-4 py-3 font-semibold text-black">
                      {p.estoque} un.
                    </td>
                    <td className="px-4 py-3 text-neutral-600">
                      {p.estoqueMinimo} un.
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={stockTone(st)}>{st}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-neutral-600">{p.atualizadoEm}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movement history */}
      <h2 className="mb-3 text-xl font-semibold text-black">
        Histórico de movimentações
      </h2>
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left">
            <thead>
              <tr className="border-b border-neutral-300 text-[12px] uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Produto</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Quantidade</th>
                <th className="px-4 py-3 font-medium">Motivo</th>
              </tr>
            </thead>
            <tbody>
              {movements.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-neutral-100 text-sm last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 text-neutral-600">{m.data}</td>
                  <td className="px-4 py-3 font-medium text-black">{m.produto}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={m.tipo === "Entrada" ? "medium" : "soft"}>
                      {m.tipo}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-neutral-700">
                    {m.quantidade > 0 ? "+" : ""}
                    {m.quantidade} un.
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{m.motivo}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Movement modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Registrar movimentação"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleRegister}>
              Salvar movimentação
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Produto"
            required
            className="sm:col-span-2"
            error={errors.produto ? "Campo obrigatório." : ""}
          >
            <Select
              value={form.produto}
              error={errors.produto}
              onChange={(e) => setForm({ ...form, produto: e.target.value })}
            >
              <option value="">Selecione o produto</option>
              {products.map((p) => (
                <option key={p.id} value={p.nome}>
                  {p.nome}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Tipo de movimentação" required>
            <Select
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as MovementType })
              }
            >
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
              <option value="Ajuste">Ajuste</option>
            </Select>
          </Field>
          <Field
            label="Quantidade"
            required
            error={errors.quantidade ? "Campo obrigatório." : ""}
          >
            <Input
              inputMode="numeric"
              value={form.quantidade}
              error={errors.quantidade}
              placeholder="0"
              onChange={(e) => setForm({ ...form, quantidade: e.target.value })}
            />
          </Field>
          <Field
            label="Motivo"
            required
            error={errors.motivo ? "Campo obrigatório." : ""}
          >
            <Input
              value={form.motivo}
              error={errors.motivo}
              placeholder="Ex.: Compra de fornecedor"
              onChange={(e) => setForm({ ...form, motivo: e.target.value })}
            />
          </Field>
          <Field label="Data">
            <Input
              value={form.data}
              placeholder="dd/mm/aaaa"
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </Field>
          <Field label="Observação" className="sm:col-span-2">
            <Textarea
              value={form.observacao}
              placeholder="Observações adicionais (opcional)"
              onChange={(e) => setForm({ ...form, observacao: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}
