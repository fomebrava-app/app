"use client";

import { useMemo, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  EmptyState,
  Field,
  Input,
  Modal,
  StatusBadge,
  SummaryCard,
} from "@/components/ui";
import { IconMoney, IconPlus, IconLayers } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { formatBRL } from "@/lib/format";
import type { FinanceLedgerEntry } from "@/lib/types";

export function FinanceClient({ ledger }: { ledger: FinanceLedgerEntry[] }) {
  const router = useRouter();
  const supabase = createClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [descricao, setDescricao] = useState("");
  const [categoria, setCategoria] = useState("Geral");
  const [valor, setValor] = useState("");
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  const totals = useMemo(() => {
    const entradas = ledger
      .filter((m) => m.tipo === "Entrada")
      .reduce((s, m) => s + Number(m.valor), 0);
    const saidas = ledger
      .filter((m) => m.tipo === "Saída")
      .reduce((s, m) => s + Number(m.valor), 0);
    return { entradas, saidas, saldo: entradas - saidas };
  }, [ledger]);

  async function salvarDespesa() {
    setErro("");
    if (!descricao.trim() || !valor.trim()) {
      setErro("Preencha descrição e valor.");
      return;
    }
    setSaving(true);
    const { error } = await supabase.from("expenses").insert({
      descricao: descricao.trim(),
      categoria: categoria.trim() || "Geral",
      valor: Number(valor.replace(",", ".")),
    });
    setSaving(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setModalOpen(false);
    setDescricao("");
    setCategoria("Geral");
    setValor("");
    router.refresh();
  }

  function handleFormSubmit(e: FormEvent) {
    e.preventDefault();
    salvarDespesa();
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <SummaryCard
          label="Entradas"
          value={formatBRL(totals.entradas)}
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Saídas"
          value={formatBRL(totals.saidas)}
          icon={<IconMoney className="h-5 w-5" />}
        />
        <SummaryCard
          label="Saldo"
          value={formatBRL(totals.saldo)}
          icon={<IconMoney className="h-5 w-5" />}
        />
      </div>

      <div className="flex justify-end">
        <Button variant="primary" onClick={() => setModalOpen(true)}>
          <IconPlus className="h-4 w-4" /> Nova despesa
        </Button>
      </div>

      {ledger.length === 0 ? (
        <EmptyState
          icon={<IconLayers className="h-10 w-10" />}
          title="Nenhuma movimentação ainda."
          description="Entradas aparecem automaticamente a partir dos pedidos pagos."
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Descrição</th>
                  <th className="px-4 py-3 font-medium">Categoria</th>
                  <th className="px-4 py-3 font-medium">Data</th>
                  <th className="px-4 py-3 font-medium">Tipo</th>
                  <th className="px-4 py-3 text-right font-medium">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {ledger.map((m) => (
                  <tr key={`${m.tipo}-${m.referencia_id}`}>
                    <td className="px-4 py-3 text-black">{m.descricao}</td>
                    <td className="px-4 py-3 text-neutral-600">{m.categoria}</td>
                    <td className="px-4 py-3 text-neutral-500">
                      {new Date(m.data).toLocaleDateString("pt-BR")}
                    </td>
                    <td className="px-4 py-3">
                      <StatusBadge tone={m.tipo === "Entrada" ? "medium" : "soft"}>
                        {m.tipo}
                      </StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-black">
                      {m.tipo === "Saída" ? "− " : "+ "}
                      {formatBRL(m.valor)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Nova despesa"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" disabled={saving} onClick={salvarDespesa}>
              {saving ? "Salvando..." : "Salvar"}
            </Button>
          </>
        }
      >
        <form onSubmit={handleFormSubmit} className="space-y-4">
          <Field label="Descrição" required>
            <Input value={descricao} onChange={(e) => setDescricao(e.target.value)} />
          </Field>
          <Field label="Categoria">
            <Input value={categoria} onChange={(e) => setCategoria(e.target.value)} />
          </Field>
          <Field label="Valor" required>
            <Input
              inputMode="decimal"
              placeholder="0,00"
              value={valor}
              onChange={(e) => setValor(e.target.value)}
            />
          </Field>
          {erro && <p className="text-sm text-red-600">{erro}</p>}
        </form>
      </Modal>
    </div>
  );
}
