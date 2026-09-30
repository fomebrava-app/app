import type { PreparationMode } from "./pricing-engine";

export interface PricingRegion {
  id: string;
  city: string;
  neighborhood: string;
  state: string;
  label: string;
  source_label: string;
  reference_date: string;
}

export interface PricingProductTemplate {
  id: string;
  region_id: string;
  product_key: string;
  nome: string;
  categoria: string;
  market_average_price: number;
  default_mode: PreparationMode;
  default_ingredients: string[];
  attention_points: string[];
}

export const DEFAULT_PRICING_REGIONS: PricingRegion[] = [
  {
    id: "11111111-1111-4111-8111-111111111111",
    city: "São Paulo",
    neighborhood: "Itaquera",
    state: "SP",
    label: "Itaquera — São Paulo/SP",
    source_label: "Referência inicial informada pelo projeto; validar antes do evento",
    reference_date: "2026-09-24",
  },
];

export const DEFAULT_PRICING_PRODUCTS: PricingProductTemplate[] = [
  {
    id: "21111111-1111-4111-8111-111111111111",
    region_id: DEFAULT_PRICING_REGIONS[0].id,
    product_key: "hamburguer",
    nome: "Hambúrguer",
    categoria: "Lanches",
    market_average_price: 25,
    default_mode: "produzido",
    default_ingredients: [
      "Pães",
      "Hambúrgueres/carne",
      "Queijo",
      "Salada e molhos",
      "Embalagens individuais",
    ],
    attention_points: [
      "Manter carnes refrigeradas e separar utensílios crus dos alimentos prontos.",
      "Planejar chapa, gás/energia, montagem e embalagem no ritmo de pico.",
      "Informar ingredientes alergênicos, especialmente glúten, leite, ovos e molhos.",
    ],
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    region_id: DEFAULT_PRICING_REGIONS[0].id,
    product_key: "pastel",
    nome: "Pastel",
    categoria: "Salgados",
    market_average_price: 15,
    default_mode: "produzido",
    default_ingredients: [
      "Massa",
      "Recheios",
      "Óleo para fritura",
      "Gás/energia da fritadeira",
      "Embalagens e guardanapos",
    ],
    attention_points: [
      "Dimensionar óleo, descarte correto, ventilação e prevenção de queimaduras.",
      "Separar recheios e utensílios para reduzir contaminação cruzada.",
      "Controlar produção por lotes para evitar perda de qualidade e desperdício.",
    ],
  },
  {
    id: "23333333-3333-4333-8333-333333333333",
    region_id: DEFAULT_PRICING_REGIONS[0].id,
    product_key: "suco",
    nome: "Suco",
    categoria: "Bebidas",
    market_average_price: 10,
    default_mode: "produzido",
    default_ingredients: [
      "Frutas ou polpa",
      "Água filtrada",
      "Açúcar/adoçante",
      "Gelo",
      "Copos, tampas e canudos",
    ],
    attention_points: [
      "Garantir água potável, gelo de procedência e refrigeração adequada.",
      "Planejar copos, tampas, canudos e espaço para descarte.",
      "Preparar em lotes compatíveis com a demanda para reduzir sobra.",
    ],
  },
];

