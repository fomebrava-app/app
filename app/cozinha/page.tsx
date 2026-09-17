import { CozinhaClient } from "./CozinhaClient";

// Tela ao vivo (Realtime) — nunca deve ser servida como HTML estático.
export const dynamic = "force-dynamic";

export default function CozinhaPage() {
  return <CozinhaClient />;
}
