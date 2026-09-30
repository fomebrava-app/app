import { AcompanharPedidoClient } from "./AcompanharPedidoClient";

// Tela ao vivo (Realtime) — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default async function AcompanharPedidoPage({
  params,
}: {
  params: Promise<{ tenant: string; codigo: string }>;
}) {
  const { tenant, codigo } = await params;
  return <AcompanharPedidoClient tenant={tenant} codigo={codigo} />;
}
