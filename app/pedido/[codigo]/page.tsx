import { AcompanharPedidoClient } from "./AcompanharPedidoClient";

// Tela ao vivo (Realtime) — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default async function AcompanharPedidoPage({
  params,
}: {
  params: Promise<{ codigo: string }>;
}) {
  const { codigo } = await params;
  return <AcompanharPedidoClient codigo={codigo} />;
}
