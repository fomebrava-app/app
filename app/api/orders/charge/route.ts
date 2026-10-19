import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentDescription } from "@/lib/customization";
import { formatBRL } from "@/lib/format";
import { createInfinitePayCheckoutLink } from "@/lib/infinitepay";
import { buildChargeMessage } from "@/lib/whatsapp";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Não autenticado." }, { status: 401 });
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("role, tenant_id")
    .eq("id", user.id)
    .maybeSingle();
  if (profile?.role !== "admin" || !profile.tenant_id) {
    return NextResponse.json({ error: "Apenas o administrador da loja pode cobrar." }, { status: 403 });
  }

  const body = (await request.json()) as { tenant?: string; orderId?: string };
  if (!body.tenant || !body.orderId) {
    return NextResponse.json({ error: "Pedido ausente." }, { status: 400 });
  }

  const admin = createAdminClient();
  const { data: tenant } = await admin
    .from("tenants")
    .select("id, slug")
    .eq("slug", body.tenant)
    .maybeSingle();
  if (!tenant || tenant.id !== profile.tenant_id) {
    return NextResponse.json({ error: "Pedido não pertence a esta loja." }, { status: 403 });
  }

  const { data: order } = await admin
    .from("orders")
    .select("id, pickup_code, total, payment_status, campaign_id, tenant_id")
    .eq("id", body.orderId)
    .maybeSingle();
  if (!order || order.tenant_id !== tenant.id) {
    return NextResponse.json({ error: "Pedido não encontrado." }, { status: 404 });
  }
  if (order.payment_status === "pago") {
    return NextResponse.json({ error: "Este pedido já está pago." }, { status: 400 });
  }

  const { data: campaign } = await admin
    .from("campaigns")
    .select("status, recebimento, pix_chave")
    .eq("id", order.campaign_id)
    .maybeSingle();
  if (!campaign || campaign.status !== "aberta") {
    return NextResponse.json({ error: "A campanha está encerrada." }, { status: 400 });
  }

  const origin = new URL(request.url).origin;
  const trackingUrl = `${origin}/${tenant.slug}/pedido/${order.pickup_code}`;
  const totalLabel = formatBRL(Number(order.total));

  if (campaign.recebimento === "pix") {
    return NextResponse.json({
      message: buildChargeMessage({
        pickupCode: order.pickup_code,
        trackingUrl,
        totalLabel,
        pixChave: campaign.pix_chave,
      }),
    });
  }

  const { data: lines, error: linesError } = await admin
    .from("order_items")
    .select("id, nome_snapshot, preco_unitario_snapshot, quantidade")
    .eq("order_id", order.id);
  if (linesError || !lines?.length) {
    return NextResponse.json(
      { error: linesError?.message ?? "Erro ao carregar itens do pedido." },
      { status: 400 }
    );
  }

  const lineIds = lines.map((line) => line.id);
  const [{ data: removals }, { data: complements }] = await Promise.all([
    admin.from("order_item_removals").select("order_item_id, nome_snapshot").in("order_item_id", lineIds),
    admin.from("order_item_complements").select("order_item_id, nome_snapshot").in("order_item_id", lineIds),
  ]);

  try {
    const paymentUrl = await createInfinitePayCheckoutLink({
      orderId: order.id,
      tenantSlug: tenant.slug,
      customerName: null,
      items: lines.map((line) => ({
        quantity: line.quantidade,
        price: Math.round(Number(line.preco_unitario_snapshot) * 100),
        description: paymentDescription(
          line.nome_snapshot,
          (removals ?? [])
            .filter((removal) => removal.order_item_id === line.id)
            .map((removal) => removal.nome_snapshot),
          (complements ?? [])
            .filter((complement) => complement.order_item_id === line.id)
            .map((complement) => complement.nome_snapshot)
        ),
      })),
    });
    return NextResponse.json({
      message: buildChargeMessage({
        pickupCode: order.pickup_code,
        trackingUrl,
        totalLabel,
        paymentUrl,
      }),
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar link de pagamento." },
      { status: 502 }
    );
  }
}
