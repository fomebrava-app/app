import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Button,
  Card,
  Field,
  Input,
  Modal,
  Select,
  StatusBadge,
  SummaryCard,
  Textarea,
  Toast,
} from "../components/ui";
import {
  financeMovements as initial,
  formatBRL,
  type FinanceStatus,
  type FinanceType,
} from "../data";
import { IconPlus, IconMoney } from "../components/icons";

function statusTone(s: FinanceStatus) {
  if (s === "Pago") return "strong" as const;
  if (s === "Pendente") return "medium" as const;
  return "outline" as const;
}

export function Finance() {
  const [list, setList] = useState(initial);
  const [period, setPeriod] = useState("mes");
  const [typeFilter, setTypeFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [toast, setToast] = useState("");

  const [form, setForm] = useState({
    descricao: "",
    tipo: "Entrada" as FinanceType,
    categoria: "",
    valor: "",
    data: "02/08/2026",
    status: "Pago" as FinanceStatus,
    observacoes: "",
  });
  const [errors, setErrors] = useState<Record<string, boolean>>({});

  const filtered = useMemo(() => {
    return list.filter((m) => {
      const matchType = !typeFilter || m.tipo === typeFilter;
      const matchStatus = !statusFilter || m.status === statusFilter;
      return matchType && matchStatus;
    });
  }, [list, typeFilter, statusFilter]);

  const totals = useMemo(() => {
    const entradas = list
      .filter((m) => m.tipo === "Entrada")
      .reduce((s, m) => s + m.valor, 0);
    const saidas = list
      .filter((m) => m.tipo === "Saída")
      .reduce((s, m) => s + m.valor, 0);
    const pendentes = list
      .filter((m) => m.status !== "Pago")
      .reduce((s, m) => s + m.valor, 0);
    return { entradas, saidas, saldo: entradas - saidas, pendentes };
  }, [list]);

  function handleSave() {
    const req: Record<string, boolean> = {};
    if (!form.descricao.trim()) req.descricao = true;
    if (!form.categoria.trim()) req.categoria = true;
    if (!form.valor) req.valor = true;
    setErrors(req);
    if (Object.keys(req).length > 0) return;

    setList([
      {
        id: Math.max(...list.map((m) => m.id)) + 1,
        descricao: form.descricao,
        tipo: form.tipo,
        categoria: form.categoria,
        valor: Number(form.valor.replace(",", ".")) || 0,
        data: form.data,
        status: form.status,
      },
      ...list,
    ]);
    setModalOpen(false);
    setForm({
      descricao: "",
      tipo: "Entrada",
      categoria: "",
      valor: "",
      data: "02/08/2026",
      status: "Pago",
      observacoes: "",
    });
    setErrors({});
    setToast("Movimentação salva com sucesso.");
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <AdminLayout
      active="finance"
      title="Controle financeiro"
      subtitle="Acompanhe entradas, saídas e o saldo da loja."
      actions={
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <IconPlus className="h-4 w-4" /> Nova movimentação
        </Button>
      }
    >
      {/* Summary */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <SummaryCard
          label="Total de entradas"
          value={formatBRL(totals.entradas)}
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Total de saídas"
          value={formatBRL(totals.saidas)}
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Saldo atual"
          value={formatBRL(totals.saldo)}
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Valores pendentes"
          value={formatBRL(totals.pendentes)}
          icon={<IconMoney className="h-5 w-5" />}
        />
      </div>

      {/* Filters */}
      <Card className="mb-5 mt-6 p-4">
        <div className="grid grid-cols-1 gap-3 md:grid-cols-3">
          <Field label="Período">
            <Select value={period} onChange={(e) => setPeriod(e.target.value)}>
              <option value="mes">Este mês</option>
              <option value="trimestre">Últimos 3 meses</option>
              <option value="ano">Este ano</option>
            </Select>
          </Field>
          <Field label="Tipo de movimentação">
            <Select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">Todos os tipos</option>
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">Todos os status</option>
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Vencido">Vencido</option>
            </Select>
          </Field>
        </div>
      </Card>

      {/* Table */}
      <Card className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[820px] text-left">
            <thead>
              <tr className="border-b border-neutral-300 text-[12px] uppercase tracking-wide text-neutral-500">
                <th className="px-4 py-3 font-medium">Descrição</th>
                <th className="px-4 py-3 font-medium">Tipo</th>
                <th className="px-4 py-3 font-medium">Categoria</th>
                <th className="px-4 py-3 font-medium">Valor</th>
                <th className="px-4 py-3 font-medium">Data</th>
                <th className="px-4 py-3 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((m) => (
                <tr
                  key={m.id}
                  className="border-b border-neutral-100 text-sm last:border-0 hover:bg-neutral-50"
                >
                  <td className="px-4 py-3 font-medium text-black">
                    {m.descricao}
                  </td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={m.tipo === "Entrada" ? "medium" : "soft"}>
                      {m.tipo}
                    </StatusBadge>
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{m.categoria}</td>
                  <td className="px-4 py-3 font-semibold text-black">
                    {m.tipo === "Saída" ? "− " : "+ "}
                    {formatBRL(m.valor)}
                  </td>
                  <td className="px-4 py-3 text-neutral-600">{m.data}</td>
                  <td className="px-4 py-3">
                    <StatusBadge tone={statusTone(m.status)}>
                      {m.status}
                    </StatusBadge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova movimentação"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>
              Salvar movimentação
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Descrição"
            required
            className="sm:col-span-2"
            error={errors.descricao ? "Campo obrigatório." : ""}
          >
            <Input
              value={form.descricao}
              error={errors.descricao}
              placeholder="Ex.: Venda pedido #1050"
              onChange={(e) => setForm({ ...form, descricao: e.target.value })}
            />
          </Field>
          <Field label="Tipo de movimentação" required>
            <Select
              value={form.tipo}
              onChange={(e) =>
                setForm({ ...form, tipo: e.target.value as FinanceType })
              }
            >
              <option value="Entrada">Entrada</option>
              <option value="Saída">Saída</option>
            </Select>
          </Field>
          <Field
            label="Categoria"
            required
            error={errors.categoria ? "Campo obrigatório." : ""}
          >
            <Input
              value={form.categoria}
              error={errors.categoria}
              placeholder="Ex.: Vendas"
              onChange={(e) => setForm({ ...form, categoria: e.target.value })}
            />
          </Field>
          <Field
            label="Valor"
            required
            error={errors.valor ? "Campo obrigatório." : ""}
          >
            <Input
              inputMode="decimal"
              value={form.valor}
              error={errors.valor}
              placeholder="0,00"
              onChange={(e) => setForm({ ...form, valor: e.target.value })}
            />
          </Field>
          <Field label="Data">
            <Input
              value={form.data}
              placeholder="dd/mm/aaaa"
              onChange={(e) => setForm({ ...form, data: e.target.value })}
            />
          </Field>
          <Field label="Status">
            <Select
              value={form.status}
              onChange={(e) =>
                setForm({ ...form, status: e.target.value as FinanceStatus })
              }
            >
              <option value="Pago">Pago</option>
              <option value="Pendente">Pendente</option>
              <option value="Vencido">Vencido</option>
            </Select>
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            <Textarea
              value={form.observacoes}
              placeholder="Observações adicionais (opcional)"
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}
