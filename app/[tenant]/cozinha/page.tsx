import { CozinhaClient } from "./CozinhaClient";

// Tela ao vivo (Realtime) — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default async function CozinhaPage({
  params,
}: {
  params: Promise<{ tenant: string }>;
}) {
  const { tenant } = await params;
  return <CozinhaClient tenant={tenant} />;
}
