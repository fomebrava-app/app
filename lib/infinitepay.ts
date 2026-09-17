import { createAdminClient } from "@/lib/supabase/admin";

const LINKS_URL = "https://api.checkout.infinitepay.io/links";
const PAYMENT_CHECK_URL = "https://api.checkout.infinitepay.io/payment_check";

export interface InfinitePayLineItem {
  quantity: number;
  price: number; // em centavos
  description: string;
}

interface LinksResponse {
  url?: string;
  checkout_url?: string;
  link?: string;
  [key: string]: unknown;
}

// O formato de resposta do endpoint /links não é 100% documentado
// publicamente — aceitamos as variações mais prováveis de chave e
// falhamos alto (com o payload bruto no erro) se nenhuma bater, para
// facilitar o diagnóstico na primeira transação real de teste.
export async function createInfinitePayCheckoutLink(params: {
  orderId: string;
  items: InfinitePayLineItem[];
  customerName?: string | null;
}): Promise<string> {
  const handle = process.env.INFINITEPAY_HANDLE;
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL;
  const defaultEmail = process.env.INFINITEPAY_DEFAULT_CUSTOMER_EMAIL;
  if (!handle) throw new Error("INFINITEPAY_HANDLE não configurado.");
  if (!siteUrl) throw new Error("NEXT_PUBLIC_SITE_URL não configurado.");

  const customer = {
    ...(params.customerName ? { name: params.customerName } : {}),
    ...(defaultEmail ? { email: defaultEmail } : {}),
  };

  const res = await fetch(LINKS_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle,
      order_nsu: params.orderId,
      items: params.items,
      redirect_url: `${siteUrl}/pagamento/retorno?order_nsu=${params.orderId}`,
      webhook_url: `${siteUrl}/api/payments/infinitepay/webhook`,
      ...(Object.keys(customer).length > 0 ? { customer } : {}),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao criar link InfinitePay (HTTP ${res.status}): ${text}`);
  }

  const data = (await res.json()) as LinksResponse;
  const url = data.url ?? data.checkout_url ?? data.link;
  if (!url) {
    throw new Error(
      `Resposta da InfinitePay sem URL de pagamento reconhecível: ${JSON.stringify(data)}`
    );
  }
  return url;
}

interface PaymentCheckResult {
  success: boolean;
  paid: boolean;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: "credit_card" | "pix";
}

// Sempre chamado antes de confiar em um webhook — a InfinitePay não
// assina o payload do webhook, então tratamos ele só como um "avise-me
// que algo mudou" e confirmamos a autenticidade aqui, direto na API.
async function checkInfinitePayPayment(params: {
  orderNsu: string;
  transactionNsu: string;
  slug: string;
}): Promise<PaymentCheckResult> {
  const handle = process.env.INFINITEPAY_HANDLE;
  if (!handle) throw new Error("INFINITEPAY_HANDLE não configurado.");

  const res = await fetch(PAYMENT_CHECK_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      handle,
      order_nsu: params.orderNsu,
      transaction_nsu: params.transactionNsu,
      slug: params.slug,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Falha ao consultar pagamento InfinitePay (HTTP ${res.status}): ${text}`);
  }

  return (await res.json()) as PaymentCheckResult;
}

// Confirma e aplica o pagamento de um pedido. Chamado tanto pelo webhook
// quanto pela página de retorno — é a única porta de entrada para marcar
// um pedido como pago, e é idempotente (seguro de chamar mais de uma vez).
export async function confirmInfinitePayPayment(params: {
  orderId: string;
  transactionNsu: string;
  slug: string;
  receiptUrl?: string | null;
  captureMethod: "credit_card" | "pix";
}): Promise<{ confirmed: boolean; alreadyProcessed: boolean }> {
  const supabase = createAdminClient();

  const { data: order, error: orderError } = await supabase
    .from("orders")
    .select("id, payment_status")
    .eq("id", params.orderId)
    .maybeSingle();

  if (orderError) throw orderError;
  if (!order) return { confirmed: false, alreadyProcessed: false };
  if (order.payment_status === "pago") {
    return { confirmed: true, alreadyProcessed: true };
  }

  const check = await checkInfinitePayPayment({
    orderNsu: params.orderId,
    transactionNsu: params.transactionNsu,
    slug: params.slug,
  });

  if (!check.success || !check.paid) {
    return { confirmed: false, alreadyProcessed: false };
  }

  const paymentMethod =
    params.captureMethod === "pix" ? "infinitepay_pix" : "infinitepay_credito";

  const { data: updated, error: updateError } = await supabase
    .from("orders")
    .update({
      payment_status: "pago",
      status: "recebido",
      payment_method: paymentMethod,
      infinitepay_transaction_nsu: params.transactionNsu,
      infinitepay_slug: params.slug,
      infinitepay_receipt_url: params.receiptUrl ?? null,
      paid_at: new Date().toISOString(),
    })
    .eq("id", params.orderId)
    .eq("payment_status", "pendente") // idempotência: só aplica uma vez
    .select("id")
    .maybeSingle();

  if (updateError) throw updateError;
  if (!updated) return { confirmed: true, alreadyProcessed: true };

  await supabase.from("order_status_events").insert({
    order_id: params.orderId,
    status_anterior: "aguardando_pagamento",
    status_novo: "recebido",
  });

  return { confirmed: true, alreadyProcessed: false };
}
