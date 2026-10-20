import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { paymentDescription } from "@/lib/customization";
import { createInfinitePayCheckoutLink } from "@/lib/infinitepay";
import { verifyPdvPassword } from "@/lib/pdv-auth";

interface OrderItemInput {
  menu_item_id: string;
  quantidade: number;
  remover_ids?: string[];
  complemento_ids?: string[];
}

interface CreateOrderBody {
  channel: "online" | "pdv";
  tenant?: string;
  items: OrderItemInput[];
  payment_method?: "dinheiro" | "pix_presencial" | "reserva";
  customer_name?: string;
  customer_phone?: string;
  fulfillment?: "retirada" | "entrega";
  endereco?: string;
  pdv_token?: string;
  pdv_password?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateOrderBody;

  if (!body.items?.length) {
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  if (!body.tenant) {
    return NextResponse.json({ error: "Tenant ausente." }, { status: 400 });
  }

  if (body.channel === "pdv") {
    if (!body.pdv_token || !body.pdv_password) {
      return NextResponse.json({ error: "Autenticação do PDV ausente." }, { status: 401 });
    }
    if (
      !body.payment_method ||
      !["dinheiro", "pix_presencial", "reserva"].includes(body.payment_method)
    ) {
      return NextResponse.json({ error: "Forma de pagamento inválida." }, { status: 400 });
    }

    const admin = createAdminClient();
    const { data: link } = await admin
      .from("pdv_links")
      .select("id, label, password_hash, ativo")
      .eq("token", body.pdv_token)
      .maybeSingle();

    if (!link || !link.ativo || !verifyPdvPassword(body.pdv_password, link.password_hash)) {
      return NextResponse.json({ error: "Senha de acesso do PDV inválida." }, { status: 401 });
    }

    const { data, error } = await admin.rpc("create_order", {
      p_channel: "pdv",
      p_items: body.items,
      p_tenant_slug: body.tenant,
      p_payment_method: body.payment_method,
      p_customer_name: body.customer_name ?? null,
      p_pdv_link_id: link.id,
      p_pdv_label_snapshot: link.label,
      p_fulfillment: "retirada",
    });

    if (error || !data?.[0]) {
      return NextResponse.json(
        { error: error?.message ?? "Erro ao criar pedido." },
        { status: 400 }
      );
    }

    const order = data[0];
    return NextResponse.json({ orderId: order.id, pickupCode: order.pickup_code });
  }

  const supabase = await createClient();

  // channel === "online"
  const { data, error } = await supabase.rpc("create_order", {
    p_channel: "online",
    p_items: body.items,
    p_tenant_slug: body.tenant,
    p_customer_name: body.customer_name ?? null,
    p_customer_phone: body.customer_phone ?? null,
    p_fulfillment: body.fulfillment ?? "retirada",
    p_endereco: body.endereco ?? null,
  });

  if (error || !data?.[0]) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar pedido." },
      { status: 400 }
    );
  }

  const order = data[0];

  const admin = createAdminClient();
  const { data: createdOrder, error: createdError } = await admin
    .from("orders")
    .select("campaign_id")
    .eq("id", order.id)
    .single();

  if (createdError || !createdOrder) {
    return NextResponse.json(
      { error: createdError?.message ?? "Erro ao carregar a campanha do pedido." },
      { status: 400 }
    );
  }

  const { data: campaign, error: campaignError } = await admin
    .from("campaigns")
    .select("recebimento, pix_chave, reserva_antes_pagamento")
    .eq("id", createdOrder.campaign_id)
    .single();

  if (campaignError || !campaign) {
    return NextResponse.json(
      { error: campaignError?.message ?? "Campanha do pedido não encontrada." },
      { status: 400 }
    );
  }

  if (campaign.reserva_antes_pagamento || campaign.recebimento === "pix") {
    return NextResponse.json({
      orderId: order.id,
      pickupCode: order.pickup_code,
      total: order.total,
      mode: campaign.reserva_antes_pagamento ? "reserva" : "pix",
      recebimento: campaign.recebimento,
      pixChave: campaign.pix_chave,
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
  const [{ data: removals, error: removalsError }, { data: complements, error: complementsError }] =
    await Promise.all([
      admin.from("order_item_removals").select("order_item_id, nome_snapshot").in("order_item_id", lineIds),
      admin
        .from("order_item_complements")
        .select("order_item_id, nome_snapshot")
        .in("order_item_id", lineIds),
    ]);

  if (removalsError || complementsError) {
    return NextResponse.json(
      { error: removalsError?.message ?? complementsError?.message ?? "Erro ao carregar a montagem." },
      { status: 400 }
    );
  }

  const linkItems = lines.map((line) => {
    const retirados = (removals ?? [])
      .filter((removal) => removal.order_item_id === line.id)
      .map((removal) => removal.nome_snapshot);
    const complementos = (complements ?? [])
      .filter((complement) => complement.order_item_id === line.id)
      .map((complement) => complement.nome_snapshot);
    return {
      quantity: line.quantidade,
      price: Math.round(Number(line.preco_unitario_snapshot) * 100),
      description: paymentDescription(line.nome_snapshot, retirados, complementos),
    };
  });

  try {
    const paymentUrl = await createInfinitePayCheckoutLink({
      orderId: order.id,
      tenantSlug: body.tenant,
      items: linkItems,
      customerName: body.customer_name,
    });
    return NextResponse.json({
      orderId: order.id,
      pickupCode: order.pickup_code,
      total: order.total,
      mode: "infinitepay",
      recebimento: "infinitepay",
      paymentUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar link de pagamento." },
      { status: 502 }
    );
  }
}
