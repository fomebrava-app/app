"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Select, StatusBadge, SummaryCard, Toast } from "@/components/ui";
import { IconAlert, IconCalculator, IconMoney, IconPlus, IconTrash } from "@/components/icons";
import { formatBRL } from "@/lib/format";
import {
  calculateSolidarityPricing,
  type PricingIngredientInput,
  type PricingProductInput,
  type PricingSharedCostInput,
  type PreparationMode,
} from "@/lib/pricing-engine";
import type { PricingProductTemplate, PricingRegion } from "@/lib/pricing-catalog";
import type { PricingScenarioSummary } from "@/lib/types";

const SHARED_COST_NAMES = [
  "Gás e energia",
  "Embalagens e descartáveis gerais",
  "Higiene e limpeza",
  "Transporte",
  "Taxas de pagamento",
  "Perdas e imprevistos já conhecidos",
];

type ProductDraft = PricingProductInput & {
  precoAplicado: number;
  precoAplicadoManual: boolean;
};

function createProduct(
  template: PricingProductTemplate,
  prefix = `produto-${template.id}`
): ProductDraft {
  return {
    id: prefix,
    templateId: template.id,
    nome: template.nome,
    mode: template.default_mode,
    quantidade: 0,
    precoMercado: Number(template.market_average_price),
    custoUnitarioPronto: 0,
    ingredientes: template.default_ingredients.map((nome, index) => ({
      id: `${prefix}-ingrediente-${index}`,
      nome,
      valor: 0,
    })),
    pontosAtencao: template.attention_points,
    precoAplicado: 0,
    precoAplicadoManual: false,
  };
}

function createCustomProduct(): ProductDraft {
  const id = crypto.randomUUID();
  return {
    id,
    templateId: null,
    nome: "Novo produto",
    mode: "produzido",
    quantidade: 0,
    precoMercado: 0,
    custoUnitarioPronto: 0,
    ingredientes: [
      { id: `${id}-ingrediente-0`, nome: "Ingredientes", valor: 0 },
    ],
    pontosAtencao: [],
    precoAplicado: 0,
    precoAplicadoManual: false,
  };
}

function NumericInput({
  value,
  onChange,
  min = 0,
  step = "0.01",
  placeholder,
}: {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  step?: string;
  placeholder?: string;
}) {
  return (
    <Input
      type="number"
      inputMode="decimal"
      min={min}
      step={step}
      placeholder={placeholder}
      value={value || ""}
      onChange={(event) => onChange(Math.max(min, Number(event.target.value) || 0))}
    />
  );
}

export function PricingAssistant({
  regions,
  templates,
  recentScenarios,
}: {
  regions: PricingRegion[];
  templates: PricingProductTemplate[];
  recentScenarios: PricingScenarioSummary[];
}) {
  const router = useRouter();
  const initialRegionId = regions[0]?.id ?? "";
  const initialTemplates = templates.filter((item) => item.region_id === initialRegionId);
  const [nomePlano, setNomePlano] = useState("Planejamento do evento");
  const [regionId, setRegionId] = useState(initialRegionId);
  const [orcamento, setOrcamento] = useState(1500);
  const [reserva, setReserva] = useState(10);
  const [metaArrecadacao, setMetaArrecadacao] = useState(0);
  const [produtos, setProdutos] = useState<ProductDraft[]>(() =>
    initialTemplates.map((template) => createProduct(template))
  );
  const [custosCompartilhados, setCustosCompartilhados] = useState<
    PricingSharedCostInput[]
  >(() =>
    SHARED_COST_NAMES.map((nome, index) => ({
      id: `compartilhado-${index}`,
      nome,
      valor: 0,
    }))
  );
  const [templateToAdd, setTemplateToAdd] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const selectedRegion = regions.find((region) => region.id === regionId);
  const regionTemplates = templates.filter((template) => template.region_id === regionId);
  const availableTemplates = regionTemplates.filter(
    (template) => !produtos.some((produto) => produto.templateId === template.id)
  );

  const calculationInput = useMemo(
    () => ({
      orcamentoDisponivel: orcamento,
      percentualReserva: reserva,
      metaArrecadacao,
      produtos,
      custosCompartilhados,
    }),
    [orcamento, reserva, metaArrecadacao, produtos, custosCompartilhados]
  );
  const result = useMemo(
    () => calculateSolidarityPricing(calculationInput),
    [calculationInput]
  );

  const precoAplicadoPorProduto = useMemo(() => {
    const mapa = new Map<string, number>();
    for (const produto of produtos) {
      const sugerido =
        result.produtos.find((item) => item.id === produto.id)?.precoSugerido ?? 0;
      mapa.set(
        produto.id,
        produto.precoAplicadoManual ? produto.precoAplicado : sugerido
      );
    }
    return mapa;
  }, [produtos, result.produtos]);

  const receitaComPrecosAplicados = useMemo(
    () =>
      result.produtos.reduce(
        (total, produto) =>
          total + (precoAplicadoPorProduto.get(produto.id) ?? 0) * produto.quantidade,
        0
      ),
    [precoAplicadoPorProduto, result.produtos]
  );

  function updateProduct(id: string, changes: Partial<ProductDraft>) {
    setProdutos((current) =>
      current.map((produto) => (produto.id === id ? { ...produto, ...changes } : produto))
    );
  }

  function updateIngredient(
    productId: string,
    ingredientId: string,
    changes: Partial<PricingIngredientInput>
  ) {
    setProdutos((current) =>
      current.map((produto) =>
        produto.id === productId
          ? {
              ...produto,
              ingredientes: produto.ingredientes.map((ingrediente) =>
                ingrediente.id === ingredientId
                  ? { ...ingrediente, ...changes }
                  : ingrediente
              ),
            }
          : produto
      )
    );
  }

  function addIngredient(productId: string) {
    const ingredient: PricingIngredientInput = {
      id: crypto.randomUUID(),
      nome: "Outro custo",
      valor: 0,
    };
    setProdutos((current) =>
      current.map((produto) =>
        produto.id === productId
          ? { ...produto, ingredientes: [...produto.ingredientes, ingredient] }
          : produto
      )
    );
  }

  function addSelectedTemplate() {
    const template = templates.find((item) => item.id === templateToAdd);
    if (!template) return;
    setProdutos((current) => [
      ...current,
      createProduct(template, crypto.randomUUID()),
    ]);
    setTemplateToAdd("");
  }

  function changeRegion(nextRegionId: string) {
    setRegionId(nextRegionId);
    const prices = new Map(
      templates
        .filter((template) => template.region_id === nextRegionId)
        .map((template) => [template.product_key, template])
    );
    setProdutos((current) =>
      current.map((produto) => {
        const oldTemplate = templates.find((item) => item.id === produto.templateId);
        const replacement = oldTemplate ? prices.get(oldTemplate.product_key) : undefined;
        return replacement
          ? {
              ...produto,
              templateId: replacement.id,
              precoMercado: Number(replacement.market_average_price),
              pontosAtencao: replacement.attention_points,
            }
          : produto;
      })
    );
  }

  async function saveScenario() {
    setError("");
    setMessage("");
    if (produtos.length === 0 || result.totalUnidades === 0) {
      setError("Inclua produtos e quantidades antes de salvar.");
      return;
    }
    setSaving(true);
    try {
      const response = await fetch("/api/admin/pricing-scenarios", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nome: nomePlano,
          regionId: regionId || null,
          totalBudget: orcamento,
          reservePercentage: reserva,
          fundraisingTarget: metaArrecadacao,
          totalPlannedCost: result.custoPlanejadoTotal,
          suggestedRevenue: result.receitaProjetada,
          inputSnapshot: calculationInput,
          resultSnapshot: result,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setMessage("Planejamento salvo.");
      router.refresh();
      setTimeout(() => setMessage(""), 2500);
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : "Erro inesperado.");
    } finally {
      setSaving(false);
    }
  }

  const allocationRows = [
    ...result.produtos.map((produto) => ({ nome: produto.nome, valor: produto.custoDireto })),
    ...custosCompartilhados.filter((item) => item.valor > 0),
  ];

  return (
    <div className="space-y-6">
      <Card className="border-brand-navy/20 bg-brand-navy/5 p-5">
        <div className="flex items-start gap-3">
          <IconCalculator className="mt-0.5 h-6 w-6 flex-none text-brand-navy" />
          <div>
            <h2 className="text-lg font-semibold text-black">Preço justo para sustentar a ação</h2>
            <p className="mt-1 max-w-3xl text-sm leading-relaxed text-neutral-700">
              O cálculo procura cobrir compras e operação, proteger o evento contra perdas e,
              se você quiser, gerar uma arrecadação definida. A média regional é uma referência,
              não uma obrigação de cobrar o máximo possível.
            </p>
          </div>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          1. Objetivo e orçamento
        </h2>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-5">
          <Field label="Nome do planejamento" required className="xl:col-span-2">
            <Input value={nomePlano} onChange={(event) => setNomePlano(event.target.value)} />
          </Field>
          <Field label="Região de referência">
            <Select value={regionId} onChange={(event) => changeRegion(event.target.value)}>
              {regions.map((region) => (
                <option key={region.id} value={region.id}>{region.label}</option>
              ))}
            </Select>
          </Field>
          <Field label="Orçamento disponível">
            <NumericInput value={orcamento} onChange={setOrcamento} />
          </Field>
          <Field label="Reserva de segurança (%)">
            <NumericInput value={reserva} onChange={(value) => setReserva(Math.min(100, value))} />
          </Field>
          <Field label="Meta de arrecadação para a causa" className="xl:col-start-4 xl:col-span-2">
            <NumericInput value={metaArrecadacao} onChange={setMetaArrecadacao} />
          </Field>
        </div>
        {selectedRegion && (
          <p className="mt-4 rounded border border-brand-yellow/60 bg-brand-yellow/10 px-3 py-2 text-xs text-neutral-700">
            Fonte do parâmetro: {selectedRegion.source_label}. Referência de {new Date(`${selectedRegion.reference_date}T12:00:00`).toLocaleDateString("pt-BR")}.
          </p>
        )}
      </Card>

      <Card className="p-5">
        <div className="mb-4 flex flex-col gap-3 border-b border-neutral-200 pb-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-black">2. O que será vendido</h2>
            <p className="mt-1 text-sm text-neutral-500">
              Informe a quantidade pronta para venda e todo valor direcionado à produção.
            </p>
          </div>
          <div className="flex flex-col gap-2 sm:flex-row">
            <Select value={templateToAdd} onChange={(event) => setTemplateToAdd(event.target.value)}>
              <option value="">Adicionar da lista regional...</option>
              {availableTemplates.map((template) => (
                <option key={template.id} value={template.id}>
                  {template.nome} — {formatBRL(Number(template.market_average_price))}
                </option>
              ))}
            </Select>
            <Button onClick={addSelectedTemplate} disabled={!templateToAdd}>
              <IconPlus className="h-4 w-4" /> Adicionar
            </Button>
            <Button onClick={() => setProdutos((current) => [...current, createCustomProduct()])}>
              Produto personalizado
            </Button>
          </div>
        </div>

        <div className="space-y-4">
          {produtos.map((produto, productIndex) => (
            <Card key={produto.id} className="border-neutral-300 p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="grid flex-1 grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-5">
                  <Field label={`Produto ${productIndex + 1}`}>
                    <Input value={produto.nome} onChange={(event) => updateProduct(produto.id, { nome: event.target.value })} />
                  </Field>
                  <Field label="Como será obtido">
                    <Select
                      value={produto.mode}
                      onChange={(event) => updateProduct(produto.id, { mode: event.target.value as PreparationMode })}
                    >
                      <option value="produzido">Será produzido</option>
                      <option value="pronto">Comprado pronto</option>
                    </Select>
                  </Field>
                  <Field label="Unidades para vender">
                    <NumericInput value={produto.quantidade} step="1" onChange={(value) => updateProduct(produto.id, { quantidade: Math.floor(value) })} />
                  </Field>
                  <Field label="Média de preço na região">
                    <NumericInput value={produto.precoMercado} onChange={(value) => updateProduct(produto.id, { precoMercado: value })} />
                  </Field>
                  <Field label="Preço aplicado">
                    <NumericInput
                      value={precoAplicadoPorProduto.get(produto.id) ?? 0}
                      onChange={(value) =>
                        updateProduct(produto.id, {
                          precoAplicado: value,
                          precoAplicadoManual: true,
                        })
                      }
                    />
                  </Field>
                </div>
                <button
                  type="button"
                  aria-label={`Remover ${produto.nome}`}
                  onClick={() => setProdutos((current) => current.filter((item) => item.id !== produto.id))}
                  className="rounded p-2 text-neutral-400 hover:bg-neutral-100 hover:text-black"
                >
                  <IconTrash className="h-4 w-4" />
                </button>
              </div>

              {produto.mode === "pronto" ? (
                <div className="mt-4 max-w-sm">
                  <Field label="Quanto custou cada unidade pronta">
                    <NumericInput value={produto.custoUnitarioPronto} onChange={(value) => updateProduct(produto.id, { custoUnitarioPronto: value })} />
                  </Field>
                </div>
              ) : (
                <div className="mt-4">
                  <p className="mb-2 text-sm font-semibold text-neutral-700">Valor destinado a cada parte da produção</p>
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2 xl:grid-cols-3">
                    {produto.ingredientes.map((ingrediente) => (
                      <div key={ingrediente.id} className="flex gap-2">
                        <Input
                          aria-label="Nome do ingrediente ou custo"
                          value={ingrediente.nome}
                          onChange={(event) => updateIngredient(produto.id, ingrediente.id, { nome: event.target.value })}
                        />
                        <div className="w-32 flex-none">
                          <NumericInput value={ingrediente.valor} onChange={(value) => updateIngredient(produto.id, ingrediente.id, { valor: value })} />
                        </div>
                        <button
                          type="button"
                          aria-label={`Remover ${ingrediente.nome}`}
                          onClick={() => updateProduct(produto.id, { ingredientes: produto.ingredientes.filter((item) => item.id !== ingrediente.id) })}
                          className="rounded px-2 text-neutral-400 hover:bg-neutral-100 hover:text-black"
                        >
                          ×
                        </button>
                      </div>
                    ))}
                  </div>
                  <Button size="sm" className="mt-3" onClick={() => addIngredient(produto.id)}>
                    <IconPlus className="h-3.5 w-3.5" /> Outro ingrediente ou custo
                  </Button>
                </div>
              )}
            </Card>
          ))}
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-1 text-lg font-semibold text-black">3. Custos que atendem todo o evento</h2>
        <p className="mb-4 text-sm text-neutral-500">
          Preencha somente o que ainda não foi lançado dentro de um produto, para não contar duas vezes.
        </p>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {custosCompartilhados.map((item) => (
            <Field key={item.id} label={item.nome}>
              <NumericInput
                value={item.valor}
                onChange={(value) => setCustosCompartilhados((current) => current.map((cost) => cost.id === item.id ? { ...cost, valor: value } : cost))}
              />
            </Field>
          ))}
        </div>
      </Card>

      <section aria-labelledby="pricing-result-title" className="space-y-4">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 id="pricing-result-title" className="text-xl font-bold text-black">Recomendação solidária</h2>
            <p className="mt-1 text-sm text-neutral-500">Atualizada automaticamente conforme o planejamento.</p>
          </div>
          <Button variant="primary" onClick={saveScenario} disabled={saving}>
            {saving ? "Salvando..." : "Salvar planejamento"}
          </Button>
        </div>

        {error && <p className="rounded border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</p>}

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-5">
          <SummaryCard label="Custo planejado" value={formatBRL(result.custoPlanejadoTotal)} hint={`Saldo do orçamento: ${formatBRL(result.saldoOrcamento)}`} icon={<IconMoney className="h-5 w-5" />} />
          <SummaryCard label="Receita necessária" value={formatBRL(result.receitaNecessaria)} hint="Custo + proteção + meta da causa" icon={<IconCalculator className="h-5 w-5" />} />
          <SummaryCard label="Receita com preços sugeridos" value={formatBRL(result.receitaProjetada)} hint={`${result.unidadesEstimadasParaMeta} de ${result.totalUnidades} unidades no mix estimado`} icon={<IconMoney className="h-5 w-5" />} />
          <SummaryCard label="Receita com preços aplicados" value={formatBRL(receitaComPrecosAplicados)} hint="Preço aplicado × unidades previstas" icon={<IconMoney className="h-5 w-5" />} />
          <SummaryCard label="Excedente para proteção e causa" value={formatBRL(result.excedenteProjetado)} hint="Antes de perdas ou custos não informados" icon={<IconMoney className="h-5 w-5" />} />
        </div>

        {result.alertas.length > 0 && (
          <Card className="border-brand-orange/40 bg-brand-orange/5 p-4">
            <div className="flex gap-3">
              <IconAlert className="mt-0.5 h-5 w-5 flex-none text-brand-orange-dark" />
              <div>
                <p className="text-sm font-semibold text-black">Pontos para revisar</p>
                <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-neutral-700">
                  {result.alertas.map((alerta) => <li key={alerta}>{alerta}</li>)}
                </ul>
              </div>
            </div>
          </Card>
        )}

        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-4 py-3">Produto</th>
                  <th className="px-4 py-3 text-right">Unidades</th>
                  <th className="px-4 py-3 text-right">Custo/un.</th>
                  <th className="px-4 py-3 text-right">Média regional</th>
                  <th className="px-4 py-3 text-right">Preço sugerido</th>
                  <th className="px-4 py-3 text-right">Preço aplicado</th>
                  <th className="px-4 py-3 text-right">Receita prevista</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {result.produtos.map((produto) => {
                  const precoAplicado = precoAplicadoPorProduto.get(produto.id) ?? 0;
                  const receitaPrevista = precoAplicado * produto.quantidade;
                  return (
                  <tr key={produto.id}>
                    <td className="px-4 py-3">
                      <p className="text-black">{produto.nome}</p>
                      <StatusBadge tone="soft" className="mt-1">{produto.mode === "pronto" ? "Comprado pronto" : "Produção própria"}</StatusBadge>
                    </td>
                    <td className="px-4 py-3 text-right">{produto.quantidade}</td>
                    <td className="px-4 py-3 text-right">{formatBRL(produto.custoCompletoUnitario)}</td>
                    <td className="px-4 py-3 text-right">{formatBRL(produto.precoMercado)}</td>
                    <td className="px-4 py-3 text-right">
                      <span className="text-lg font-bold text-black">{formatBRL(produto.precoSugerido)}</span>
                      <p className="text-xs text-neutral-500">
                        {produto.diferencaMercadoPercentual > 0 ? "+" : ""}{produto.diferencaMercadoPercentual}% da média
                      </p>
                    </td>
                    <td className="px-4 py-3 text-right font-semibold text-black">{formatBRL(precoAplicado)}</td>
                    <td className="px-4 py-3 text-right font-semibold">{formatBRL(receitaPrevista)}</td>
                  </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </Card>

        <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
          <Card className="p-5">
            <h3 className="text-base font-semibold text-black">Para onde o orçamento está indo</h3>
            <div className="mt-4 space-y-3">
              {allocationRows.length === 0 && <p className="text-sm text-neutral-500">Informe os custos para visualizar a distribuição.</p>}
              {allocationRows.map((item) => {
                const percent = result.custoPlanejadoTotal > 0 ? (item.valor / result.custoPlanejadoTotal) * 100 : 0;
                return (
                  <div key={item.nome}>
                    <div className="mb-1 flex justify-between gap-3 text-xs text-neutral-600">
                      <span>{item.nome}</span><span>{formatBRL(item.valor)} · {percent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 overflow-hidden rounded-full bg-neutral-100">
                      <div className="h-full rounded-full bg-brand-navy" style={{ width: `${Math.min(100, percent)}%` }} />
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          <Card className="p-5">
            <h3 className="text-base font-semibold text-black">Atenção antes de cozinhar</h3>
            <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-relaxed text-neutral-700">
              {[...new Set(produtos.flatMap((produto) => produto.pontosAtencao))].map((point) => <li key={point}>{point}</li>)}
              <li>Confirme acesso a água potável, refrigeração, energia, descarte e local de lavagem das mãos.</li>
              <li>Defina responsáveis por compras, preparo, caixa, reposição, limpeza e conferência final.</li>
              <li>Faça uma contagem inicial e final para aprender o consumo real e reduzir perdas no próximo evento.</li>
            </ul>
          </Card>
        </div>
      </section>

      {recentScenarios.length > 0 && (
        <Card className="p-5">
          <h2 className="text-lg font-semibold text-black">Planejamentos recentes</h2>
          <div className="mt-4 grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
            {recentScenarios.map((scenario) => (
              <div key={scenario.id} className="rounded border border-neutral-200 p-4">
                <p className="text-sm font-semibold text-black">{scenario.nome}</p>
                <p className="mt-2 text-xs text-neutral-500">Custo {formatBRL(Number(scenario.total_planned_cost))} · Receita sugerida {formatBRL(Number(scenario.suggested_revenue))}</p>
                <p className="mt-1 text-xs text-neutral-400">{new Date(scenario.created_at).toLocaleString("pt-BR")}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      <Toast message={message} visible={!!message} />
    </div>
  );
}

