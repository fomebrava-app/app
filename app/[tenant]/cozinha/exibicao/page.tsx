import { ExibicaoClient } from "./ExibicaoClient";

// Tela ao vivo (Realtime) — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default async function ExibicaoPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return <ExibicaoClient tenant={tenant} />;
}
