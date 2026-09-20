import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import { CartProvider } from "@/lib/cart-context";
import "./globals.css";

const fontDisplay = localFont({
  src: [
    { path: "./fonts/CreatoDisplay-Bold.otf", weight: "700", style: "normal" },
    { path: "./fonts/CreatoDisplay-ExtraBold.otf", weight: "800", style: "normal" },
  ],
  variable: "--font-display",
  display: "swap",
});

const fontBody = localFont({
  src: [
    { path: "./fonts/LouisGeorgeCafe-Regular.ttf", weight: "400", style: "normal" },
    { path: "./fonts/LouisGeorgeCafe-Bold.ttf", weight: "700", style: "normal" },
  ],
  variable: "--font-body",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Cardápio do Evento",
  description:
    "Cardápio virtual do evento — escolha, peça pelo celular e acompanhe seu pedido em tempo real.",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="pt-BR" className={`${fontDisplay.variable} ${fontBody.variable}`}>
      <body>
        <CartProvider>{children}</CartProvider>
      </body>
    </html>
  );
}
