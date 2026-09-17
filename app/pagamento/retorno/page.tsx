import { redirect } from "next/navigation";
import { confirmInfinitePayPayment } from "@/lib/infinitepay";
import { createAdminClient } from "@/lib/supabase/admin";

function firstParam(value: string | string[] | undefined): string | undefined {
  return typeof value === "string" ? value : undefined;
}

export default async function PagamentoRetornoPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const params = await searchParams;
  const orderId = firstParam(params.order_nsu);
  const transactionNsu = firstParam(params.transaction_nsu);
  const slug = firstParam(params.slug);
  const receiptUrl = firstParam(params.receipt_url);
  const captureMethod = params.capture_method === "pix" ? "pix" : "credit_card";

  if (orderId && transactionNsu && slug) {
    try {
      await confirmInfinitePayPayment({
        orderId,
        transactionNsu,
        slug,
        receiptUrl,
        captureMethod,
      });
    } catch (err) {
      // Não bloqueia o redirecionamento — se o webhook já confirmou (ou
      // vier a confirmar) o pedido, a tela de acompanhamento mostra o
      // status certo de qualquer forma.
      console.error("Erro ao confirmar pagamento no retorno:", err);
    }
  }

  if (orderId) {
    const supabase = createAdminClient();
    const { data: order } = await supabase
      .from("orders")
      .select("pickup_code")
      .eq("id", orderId)
      .maybeSingle();
    if (order?.pickup_code) {
      redirect(`/pedido/${order.pickup_code}`);
    }
  }

  redirect("/pedido");
}
