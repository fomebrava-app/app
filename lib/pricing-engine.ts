export type PreparationMode = "pronto" | "produzido";

export interface PricingIngredientInput {
  id: string;
  nome: string;
  valor: number;
}

export interface PricingProductInput {
  id: string;
  templateId?: string | null;
  nome: string;
  mode: PreparationMode;
  quantidade: number;
  precoMercado: number;
  custoUnitarioPronto: number;
  ingredientes: PricingIngredientInput[];
  pontosAtencao: string[];
}

export interface PricingSharedCostInput {
  id: string;
  nome: string;
  valor: number;
}

export interface PricingCalculationInput {
  orcamentoDisponivel: number;
  percentualReserva: number;
  metaArrecadacao: number;
  produtos: PricingProductInput[];
  custosCompartilhados: PricingSharedCostInput[];
}

export interface PricingProductResult extends PricingProductInput {
  custoDireto: number;
  custoCompartilhadoRateado: number;
  custoCompleto: number;
  custoCompletoUnitario: number;
  precoSugerido: number;
  receitaProjetada: number;
  diferencaMercadoPercentual: number;
}

export interface PricingCalculationResult {
  produtos: PricingProductResult[];
  custoDiretoTotal: number;
  custoCompartilhadoTotal: number;
  custoPlanejadoTotal: number;
  saldoOrcamento: number;
  receitaNecessaria: number;
  receitaPotencialMercado: number;
  receitaProjetada: number;
  excedenteProjetado: number;
  fatorSobreMercado: number;
  totalUnidades: number;
  unidadesEstimadasParaMeta: number;
  alertas: string[];
}

function finitePositive(value: number): number {
  return Number.isFinite(value) && value > 0 ? value : 0;
}

function money(value: number): number {
  return Math.round((value + Number.EPSILON) * 100) / 100;
}

function friendlyPrice(value: number): number {
  if (!Number.isFinite(value) || value <= 0) return 0;
  return Math.ceil(value * 2) / 2;
}

export function calculateSolidarityPricing(
  input: PricingCalculationInput
): PricingCalculationResult {
  const percentualReserva = Math.min(100, finitePositive(input.percentualReserva));
  const metaArrecadacao = finitePositive(input.metaArrecadacao);
  const orcamentoDisponivel = finitePositive(input.orcamentoDisponivel);
  const custosCompartilhados = input.custosCompartilhados.reduce(
    (total, item) => total + finitePositive(item.valor),
    0
  );

  const baseProducts = input.produtos.map((produto) => {
    const quantidade = Math.floor(finitePositive(produto.quantidade));
    const custoDireto =
      produto.mode === "pronto"
        ? quantidade * finitePositive(produto.custoUnitarioPronto)
        : produto.ingredientes.reduce(
            (total, ingrediente) => total + finitePositive(ingrediente.valor),
            0
          );
    return {
      ...produto,
      quantidade,
      precoMercado: finitePositive(produto.precoMercado),
      custoDireto: money(custoDireto),
    };
  });

  const custoDiretoTotal = baseProducts.reduce((total, item) => total + item.custoDireto, 0);
  const totalUnidades = baseProducts.reduce((total, item) => total + item.quantidade, 0);
  const receitaPotencialMercado = baseProducts.reduce(
    (total, item) => total + item.quantidade * item.precoMercado,
    0
  );
  const custoPlanejadoTotal = custoDiretoTotal + custosCompartilhados;
  const receitaNecessaria =
    custoPlanejadoTotal * (1 + percentualReserva / 100) + metaArrecadacao;
  const fatorSobreMercado =
    receitaPotencialMercado > 0 ? receitaNecessaria / receitaPotencialMercado : 0;

  const productsWithAllocation = baseProducts.map((produto) => {
    let allocationWeight = 0;
    if (custoDiretoTotal > 0) allocationWeight = produto.custoDireto / custoDiretoTotal;
    else if (totalUnidades > 0) allocationWeight = produto.quantidade / totalUnidades;

    const custoCompartilhadoRateado = custosCompartilhados * allocationWeight;
    const custoCompleto = produto.custoDireto + custoCompartilhadoRateado;
    const custoCompletoUnitario =
      produto.quantidade > 0 ? custoCompleto / produto.quantidade : 0;
    const ancoraSolidaria = produto.precoMercado * fatorSobreMercado;
    const precoSugerido = friendlyPrice(
      Math.max(custoCompletoUnitario, ancoraSolidaria)
    );
    const receitaProjetada = precoSugerido * produto.quantidade;

    return {
      ...produto,
      custoCompartilhadoRateado: money(custoCompartilhadoRateado),
      custoCompleto: money(custoCompleto),
      custoCompletoUnitario: money(custoCompletoUnitario),
      precoSugerido: money(precoSugerido),
      receitaProjetada: money(receitaProjetada),
      diferencaMercadoPercentual:
        produto.precoMercado > 0
          ? Math.round(((precoSugerido / produto.precoMercado - 1) * 1000)) / 10
          : 0,
    };
  });

  const receitaProjetada = productsWithAllocation.reduce(
    (total, item) => total + item.receitaProjetada,
    0
  );
  const salesRatio = receitaProjetada > 0 ? Math.min(1, receitaNecessaria / receitaProjetada) : 0;
  const alertas: string[] = [];

  if (baseProducts.length === 0) {
    alertas.push("Inclua ao menos um produto para receber uma recomendação.");
  }
  if (orcamentoDisponivel > 0 && custoPlanejadoTotal > orcamentoDisponivel) {
    alertas.push(
      `O plano ultrapassa o orçamento disponível em ${money(custoPlanejadoTotal - orcamentoDisponivel).toLocaleString("pt-BR", { style: "currency", currency: "BRL" })}.`
    );
  }
  if (fatorSobreMercado > 1) {
    alertas.push(
      "Para alcançar a meta com as quantidades atuais, parte dos preços precisará ficar acima da média regional. Revise custos, quantidades ou a meta de arrecadação."
    );
  }
  if (receitaProjetada > 0 && receitaProjetada < receitaNecessaria) {
    alertas.push(
      "Mesmo com os preços sugeridos, a receita projetada não alcança toda a proteção e arrecadação desejadas. Inclua referências de mercado ou revise o mix de produtos."
    );
  }
  if (percentualReserva === 0 && custoPlanejadoTotal > 0) {
    alertas.push(
      "O plano não possui reserva para perdas, variação de preços ou itens não vendidos. Considere ao menos uma pequena proteção."
    );
  }
  for (const produto of productsWithAllocation) {
    if (produto.quantidade === 0) {
      alertas.push(`${produto.nome}: informe quantas unidades estarão disponíveis.`);
    } else if (produto.precoMercado > 0 && produto.custoCompletoUnitario > produto.precoMercado) {
      alertas.push(
        `${produto.nome}: o custo completo por unidade está acima da referência regional.`
      );
    }
  }

  return {
    produtos: productsWithAllocation,
    custoDiretoTotal: money(custoDiretoTotal),
    custoCompartilhadoTotal: money(custosCompartilhados),
    custoPlanejadoTotal: money(custoPlanejadoTotal),
    saldoOrcamento: money(orcamentoDisponivel - custoPlanejadoTotal),
    receitaNecessaria: money(receitaNecessaria),
    receitaPotencialMercado: money(receitaPotencialMercado),
    receitaProjetada: money(receitaProjetada),
    excedenteProjetado: money(receitaProjetada - custoPlanejadoTotal),
    fatorSobreMercado,
    totalUnidades,
    unidadesEstimadasParaMeta: Math.ceil(totalUnidades * salesRatio),
    alertas,
  };
}
