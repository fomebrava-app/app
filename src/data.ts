// Fictional data for the Cronos watch e-commerce prototype (pt-BR)

export function formatBRL(value: number): string {
  return value.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function formatNumber(value: number): string {
  return value.toLocaleString("pt-BR");
}

export type ProductStatus = "Ativo" | "Inativo" | "Sem estoque";

export interface Product {
  id: number;
  nome: string;
  sku: string;
  categoria: string;
  marca: string;
  modelo: string;
  descricaoCurta: string;
  descricaoCompleta: string;
  precoCusto: number;
  precoVenda: number;
  precoPromocional?: number;
  estoque: number;
  estoqueMinimo: number;
  status: ProductStatus;
  destaque: boolean;
  exibirLoja: boolean;
  imagem: string;
  atualizadoEm: string;
  criadoEm: string;
  tecnica: {
    caixa: string;
    pulseira: string;
    mecanismo: string;
    resistencia: string;
    garantia: string;
  };
}

const img = (seed: string) =>
  `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=800&q=80`;

export const products: Product[] = [
  {
    id: 1,
    nome: "Cronos Classic Steel",
    sku: "CRN-CLS-001",
    categoria: "Clássico",
    marca: "Cronos",
    modelo: "Classic Steel 40mm",
    descricaoCurta: "Relógio clássico em aço inoxidável com mostrador branco.",
    descricaoCompleta:
      "O Cronos Classic Steel combina elegância atemporal e engenharia precisa. Sua caixa em aço escovado de 40mm acompanha um mostrador branco minimalista, ideal para o dia a dia e ocasiões formais.",
    precoCusto: 620,
    precoVenda: 1299.9,
    precoPromocional: 1099.9,
    estoque: 24,
    estoqueMinimo: 8,
    status: "Ativo",
    destaque: true,
    exibirLoja: true,
    imagem: img("photo-1523275335684-37898b6baf30"),
    atualizadoEm: "02/08/2026",
    criadoEm: "12/05/2026",
    tecnica: {
      caixa: "Aço inoxidável 316L",
      pulseira: "Aço inoxidável",
      mecanismo: "Quartzo",
      resistencia: "5 ATM (50 metros)",
      garantia: "24 meses",
    },
  },
  {
    id: 2,
    nome: "Cronos Sport Diver",
    sku: "CRN-SPT-002",
    categoria: "Esportivo",
    marca: "Cronos",
    modelo: "Sport Diver 44mm",
    descricaoCurta: "Relógio esportivo resistente à água para mergulho.",
    descricaoCompleta:
      "Desenvolvido para aventuras, o Sport Diver oferece alta resistência à água, luneta rotativa e pulseira emborrachada confortável. Ideal para quem busca desempenho e durabilidade.",
    precoCusto: 780,
    precoVenda: 1749.9,
    estoque: 5,
    estoqueMinimo: 6,
    status: "Ativo",
    destaque: true,
    exibirLoja: true,
    imagem: img("photo-1548171915-e79a380a2a4b"),
    atualizadoEm: "01/08/2026",
    criadoEm: "20/04/2026",
    tecnica: {
      caixa: "Aço inoxidável",
      pulseira: "Borracha",
      mecanismo: "Automático",
      resistencia: "20 ATM (200 metros)",
      garantia: "24 meses",
    },
  },
  {
    id: 3,
    nome: "Cronos Minimal Rose",
    sku: "CRN-MIN-003",
    categoria: "Feminino",
    marca: "Cronos",
    modelo: "Minimal Rose 34mm",
    descricaoCurta: "Design minimalista em tom rosé com pulseira fina.",
    descricaoCompleta:
      "Sofisticação em cada detalhe. O Minimal Rose apresenta acabamento rosé, mostrador limpo e pulseira delicada, perfeito para compor looks elegantes.",
    precoCusto: 540,
    precoVenda: 1199.9,
    precoPromocional: 999.9,
    estoque: 18,
    estoqueMinimo: 8,
    status: "Ativo",
    destaque: true,
    exibirLoja: true,
    imagem: img("photo-1524805444758-089113d48a6d"),
    atualizadoEm: "28/07/2026",
    criadoEm: "02/03/2026",
    tecnica: {
      caixa: "Aço banhado a ouro rosé",
      pulseira: "Aço banhado a ouro rosé",
      mecanismo: "Quartzo",
      resistencia: "3 ATM (30 metros)",
      garantia: "12 meses",
    },
  },
  {
    id: 4,
    nome: "Cronos Chrono Black",
    sku: "CRN-CHR-004",
    categoria: "Cronógrafo",
    marca: "Cronos",
    modelo: "Chrono Black 42mm",
    descricaoCurta: "Cronógrafo elegante com mostrador preto e detalhes prata.",
    descricaoCompleta:
      "Precisão e estilo se encontram no Chrono Black. Com função cronógrafo completa, mostrador preto fosco e subdials contrastantes, é a escolha ideal para quem valoriza performance visual.",
    precoCusto: 690,
    precoVenda: 1599.9,
    estoque: 0,
    estoqueMinimo: 5,
    status: "Sem estoque",
    destaque: false,
    exibirLoja: true,
    imagem: img("photo-1533139502658-0198f920d8e8"),
    atualizadoEm: "25/07/2026",
    criadoEm: "18/02/2026",
    tecnica: {
      caixa: "Aço inoxidável revestido PVD",
      pulseira: "Couro legítimo",
      mecanismo: "Quartzo cronógrafo",
      resistencia: "10 ATM (100 metros)",
      garantia: "24 meses",
    },
  },
  {
    id: 5,
    nome: "Cronos Heritage Gold",
    sku: "CRN-HER-005",
    categoria: "Clássico",
    marca: "Cronos",
    modelo: "Heritage Gold 39mm",
    descricaoCurta: "Relógio dourado com inspiração vintage e pulseira de couro.",
    descricaoCompleta:
      "Um tributo à tradição relojoeira. O Heritage Gold traz acabamento dourado, numerais romanos e pulseira de couro marrom, unindo nostalgia e sofisticação.",
    precoCusto: 720,
    precoVenda: 1899.9,
    precoPromocional: 1699.9,
    estoque: 11,
    estoqueMinimo: 6,
    status: "Ativo",
    destaque: false,
    exibirLoja: true,
    imagem: img("photo-1587836374828-4dbafa94cf0e"),
    atualizadoEm: "22/07/2026",
    criadoEm: "05/01/2026",
    tecnica: {
      caixa: "Aço banhado a ouro",
      pulseira: "Couro legítimo",
      mecanismo: "Automático",
      resistencia: "5 ATM (50 metros)",
      garantia: "24 meses",
    },
  },
  {
    id: 6,
    nome: "Cronos Urban Smart",
    sku: "CRN-URB-006",
    categoria: "Smartwatch",
    marca: "Cronos",
    modelo: "Urban Smart 46mm",
    descricaoCurta: "Smartwatch com tela AMOLED e monitoramento de saúde.",
    descricaoCompleta:
      "Tecnologia no seu pulso. O Urban Smart oferece tela AMOLED, notificações, GPS e monitoramento completo de atividades físicas e saúde.",
    precoCusto: 480,
    precoVenda: 999.9,
    estoque: 3,
    estoqueMinimo: 10,
    status: "Ativo",
    destaque: true,
    exibirLoja: true,
    imagem: img("photo-1579586337278-3befd40fd17a"),
    atualizadoEm: "30/07/2026",
    criadoEm: "10/06/2026",
    tecnica: {
      caixa: "Alumínio",
      pulseira: "Silicone",
      mecanismo: "Digital (smartwatch)",
      resistencia: "5 ATM (50 metros)",
      garantia: "12 meses",
    },
  },
  {
    id: 7,
    nome: "Cronos Titanium Pro",
    sku: "CRN-TIT-007",
    categoria: "Esportivo",
    marca: "Cronos",
    modelo: "Titanium Pro 43mm",
    descricaoCurta: "Caixa em titânio ultraleve com alta durabilidade.",
    descricaoCompleta:
      "Leveza e resistência em equilíbrio perfeito. O Titanium Pro utiliza titânio de grau aeroespacial, garantindo conforto o dia inteiro sem abrir mão da robustez.",
    precoCusto: 910,
    precoVenda: 2299.9,
    estoque: 7,
    estoqueMinimo: 5,
    status: "Ativo",
    destaque: false,
    exibirLoja: true,
    imagem: img("photo-1495856458515-0637185db551"),
    atualizadoEm: "18/07/2026",
    criadoEm: "22/05/2026",
    tecnica: {
      caixa: "Titânio grau 5",
      pulseira: "Titânio",
      mecanismo: "Automático",
      resistencia: "10 ATM (100 metros)",
      garantia: "36 meses",
    },
  },
  {
    id: 8,
    nome: "Cronos Elegance Slim",
    sku: "CRN-ELE-008",
    categoria: "Feminino",
    marca: "Cronos",
    modelo: "Elegance Slim 32mm",
    descricaoCurta: "Relógio ultrafino com mostrador prateado e brilho sutil.",
    descricaoCompleta:
      "A definição de elegância discreta. O Elegance Slim possui caixa ultrafina, mostrador prateado com detalhes cintilantes e pulseira em malha milanesa.",
    precoCusto: 500,
    precoVenda: 1099.9,
    estoque: 0,
    estoqueMinimo: 6,
    status: "Inativo",
    destaque: false,
    exibirLoja: false,
    imagem: img("photo-1509048191080-d2984bad6ae5"),
    atualizadoEm: "12/07/2026",
    criadoEm: "14/04/2026",
    tecnica: {
      caixa: "Aço inoxidável",
      pulseira: "Malha milanesa",
      mecanismo: "Quartzo",
      resistencia: "3 ATM (30 metros)",
      garantia: "12 meses",
    },
  },
];

export function stockStatus(p: Product): "Estoque normal" | "Estoque baixo" | "Sem estoque" {
  if (p.estoque <= 0) return "Sem estoque";
  if (p.estoque <= p.estoqueMinimo) return "Estoque baixo";
  return "Estoque normal";
}

export interface Customer {
  id: number;
  nome: string;
  cpf: string;
  telefone: string;
  email: string;
  cidade: string;
  estado: string;
  cadastro: string;
}

export const customers: Customer[] = [
  { id: 1, nome: "Ana Beatriz Souza", cpf: "123.456.789-01", telefone: "(11) 98765-4321", email: "ana.souza@email.com", cidade: "São Paulo", estado: "SP", cadastro: "15/06/2026" },
  { id: 2, nome: "Carlos Eduardo Lima", cpf: "234.567.890-12", telefone: "(21) 99876-5432", email: "carlos.lima@email.com", cidade: "Rio de Janeiro", estado: "RJ", cadastro: "22/06/2026" },
  { id: 3, nome: "Fernanda Oliveira", cpf: "345.678.901-23", telefone: "(31) 98765-1234", email: "fernanda.oliveira@email.com", cidade: "Belo Horizonte", estado: "MG", cadastro: "01/07/2026" },
  { id: 4, nome: "João Pedro Martins", cpf: "456.789.012-34", telefone: "(41) 99123-4567", email: "joao.martins@email.com", cidade: "Curitiba", estado: "PR", cadastro: "08/07/2026" },
  { id: 5, nome: "Mariana Costa", cpf: "567.890.123-45", telefone: "(51) 98456-7890", email: "mariana.costa@email.com", cidade: "Porto Alegre", estado: "RS", cadastro: "14/07/2026" },
  { id: 6, nome: "Rafael Almeida", cpf: "678.901.234-56", telefone: "(71) 99567-8901", email: "rafael.almeida@email.com", cidade: "Salvador", estado: "BA", cadastro: "19/07/2026" },
  { id: 7, nome: "Juliana Ribeiro", cpf: "789.012.345-67", telefone: "(81) 98678-9012", email: "juliana.ribeiro@email.com", cidade: "Recife", estado: "PE", cadastro: "25/07/2026" },
  { id: 8, nome: "Bruno Fernandes", cpf: "890.123.456-78", telefone: "(62) 99789-0123", email: "bruno.fernandes@email.com", cidade: "Goiânia", estado: "GO", cadastro: "30/07/2026" },
];

export type MovementType = "Entrada" | "Saída" | "Ajuste";

export interface InventoryMovement {
  id: number;
  data: string;
  produto: string;
  tipo: MovementType;
  quantidade: number;
  motivo: string;
}

export const inventoryMovements: InventoryMovement[] = [
  { id: 1, data: "02/08/2026", produto: "Cronos Classic Steel", tipo: "Entrada", quantidade: 20, motivo: "Compra de fornecedor" },
  { id: 2, data: "01/08/2026", produto: "Cronos Sport Diver", tipo: "Saída", quantidade: 3, motivo: "Venda" },
  { id: 3, data: "31/07/2026", produto: "Cronos Urban Smart", tipo: "Saída", quantidade: 7, motivo: "Venda" },
  { id: 4, data: "30/07/2026", produto: "Cronos Heritage Gold", tipo: "Entrada", quantidade: 10, motivo: "Reposição" },
  { id: 5, data: "28/07/2026", produto: "Cronos Chrono Black", tipo: "Ajuste", quantidade: -2, motivo: "Correção de inventário" },
  { id: 6, data: "26/07/2026", produto: "Cronos Minimal Rose", tipo: "Entrada", quantidade: 15, motivo: "Compra de fornecedor" },
];

export type FinanceType = "Entrada" | "Saída";
export type FinanceStatus = "Pago" | "Pendente" | "Vencido";

export interface FinanceMovement {
  id: number;
  descricao: string;
  tipo: FinanceType;
  categoria: string;
  valor: number;
  data: string;
  status: FinanceStatus;
}

export const financeMovements: FinanceMovement[] = [
  { id: 1, descricao: "Venda pedido #1042", tipo: "Entrada", categoria: "Vendas", valor: 1749.9, data: "02/08/2026", status: "Pago" },
  { id: 2, descricao: "Compra de fornecedor Alfa", tipo: "Saída", categoria: "Estoque", valor: 6200.0, data: "01/08/2026", status: "Pago" },
  { id: 3, descricao: "Venda pedido #1041", tipo: "Entrada", categoria: "Vendas", valor: 999.9, data: "31/07/2026", status: "Pendente" },
  { id: 4, descricao: "Aluguel do escritório", tipo: "Saída", categoria: "Despesas fixas", valor: 2800.0, data: "30/07/2026", status: "Pago" },
  { id: 5, descricao: "Venda pedido #1039", tipo: "Entrada", categoria: "Vendas", valor: 3299.8, data: "28/07/2026", status: "Pago" },
  { id: 6, descricao: "Campanha de marketing digital", tipo: "Saída", categoria: "Marketing", valor: 1450.0, data: "27/07/2026", status: "Vencido" },
  { id: 7, descricao: "Venda pedido #1038", tipo: "Entrada", categoria: "Vendas", valor: 1099.9, data: "25/07/2026", status: "Pago" },
  { id: 8, descricao: "Frete de mercadorias", tipo: "Saída", categoria: "Logística", valor: 380.5, data: "24/07/2026", status: "Pendente" },
];

export const categorias = [
  "Clássico",
  "Esportivo",
  "Feminino",
  "Cronógrafo",
  "Smartwatch",
];

export const estados = [
  "AC", "AL", "AP", "AM", "BA", "CE", "DF", "ES", "GO", "MA", "MT", "MS", "MG",
  "PA", "PB", "PR", "PE", "PI", "RJ", "RN", "RS", "RO", "RR", "SC", "SP", "SE", "TO",
];
