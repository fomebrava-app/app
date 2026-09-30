import type { Metadata } from "next";
import { LandingPage } from "@/components/landing/LandingPage";

export const metadata: Metadata = {
  title: "Fomebrava",
  description:
    "Cardápio, pagamento e acompanhamento do pedido no celular para eventos e operações de alimentação.",
};

export default function HomePage() {
  return <LandingPage />;
}
