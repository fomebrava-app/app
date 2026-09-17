import { ExibicaoClient } from "./ExibicaoClient";

// Tela ao vivo (Realtime) — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default function ExibicaoPage() {
  return <ExibicaoClient />;
}
