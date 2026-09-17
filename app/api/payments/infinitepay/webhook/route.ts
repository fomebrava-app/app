import { NextResponse } from "next/server";
import { confirmInfinitePayPayment } from "@/lib/infinitepay";

interface InfinitePayWebhookPayload {
  invoice_slug: string;
  amount: number;
  paid_amount: number;
  installments: number;
  capture_method: "credit_card" | "pix";
  transaction_nsu: string;
  order_nsu: string;
  receipt_url?: string;
}

export async function POST(request: Request) {
  let payload: InfinitePayWebhookPayload;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Payload inválido." }, { status: 400 });
  }

  if (!payload.order_nsu || !payload.transaction_nsu || !payload.invoice_slug) {
    return NextResponse.json({ error: "Payload incompleto." }, { status: 400 });
  }

  try {
    // O webhook da InfinitePay não é assinado (sem HMAC) — nunca confiamos
    // nele sozinho. confirmInfinitePayPayment sempre revalida via
    // payment_check antes de marcar o pedido como pago, e é idempotente
    // (a InfinitePay reenvia o webhook se a resposta não for 200).
    await confirmInfinitePayPayment({
      orderId: payload.order_nsu,
      transactionNsu: payload.transaction_nsu,
      slug: payload.invoice_slug,
      receiptUrl: payload.receipt_url,
      captureMethod: payload.capture_method,
    });
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("Erro ao processar webhook InfinitePay:", err);
    return NextResponse.json({ error: "Erro interno." }, { status: 400 });
  }
}
