import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { createInfinitePayCheckoutLink } from "@/lib/infinitepay";
import { verifyPdvPassword } from "@/lib/pdv-auth";

interface OrderItemInput {
  menu_item_id: string;
  quantidade: number;
}

interface CreateOrderBody {
  channel: "online" | "pdv";
  items: OrderItemInput[];
  payment_method?: "dinheiro" | "pix_presencial";
  customer_name?: string;
  pdv_token?: string;
  pdv_password?: string;
}

export async function POST(request: Request) {
  const body = (await request.json()) as CreateOrderBody;

  if (!body.items?.length) {
    return NextResponse.json({ error: "Carrinho vazio." }, { status: 400 });
  }

  if (body.channel === "pdv") {
    if (!body.pdv_token || !body.pdv_password) {
      return NextResponse.json({ error: "Autenticação do PDV ausente." }, { status: 401 });
    }
    if (!body.payment_method || !["dinheiro", "pix_presencial"].includes(body.payment_method)) {
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
      p_payment_method: body.payment_method,
      p_customer_name: body.customer_name ?? null,
      p_pdv_link_id: link.id,
      p_pdv_label_snapshot: link.label,
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
    p_customer_name: body.customer_name ?? null,
  });

  if (error || !data?.[0]) {
    return NextResponse.json(
      { error: error?.message ?? "Erro ao criar pedido." },
      { status: 400 }
    );
  }

  const order = data[0];

  const { data: menuItems, error: menuError } = await supabase
    .from("menu_items")
    .select("id, nome, preco, preco_promocional")
    .in(
      "id",
      body.items.map((i) => i.menu_item_id)
    );

  if (menuError || !menuItems) {
    return NextResponse.json(
      { error: menuError?.message ?? "Erro ao carregar itens do pedido." },
      { status: 400 }
    );
  }

  const linkItems = body.items.map((i) => {
    const menuItem = menuItems.find((m) => m.id === i.menu_item_id)!;
    const price = menuItem.preco_promocional ?? menuItem.preco;
    return {
      quantity: i.quantidade,
      price: Math.round(price * 100),
      description: menuItem.nome,
    };
  });

  try {
    const paymentUrl = await createInfinitePayCheckoutLink({
      orderId: order.id,
      items: linkItems,
      customerName: body.customer_name,
    });
    return NextResponse.json({
      orderId: order.id,
      pickupCode: order.pickup_code,
      paymentUrl,
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Erro ao gerar link de pagamento." },
      { status: 502 }
    );
  }
}
