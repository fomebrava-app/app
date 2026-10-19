// Gera um link wa.me com mensagem pré-preenchida — o atendente clica para
// abrir o WhatsApp e enviar manualmente. Sem API oficial/envio automático.
export function buildWhatsAppLink(params: { phone?: string | null; message: string }): string {
  const digits = (params.phone ?? "").replace(/\D/g, "");
  const text = encodeURIComponent(params.message);

  if (!digits) {
    return `https://wa.me/?text=${text}`;
  }

  // Assume Brasil quando o número não vier com código do país.
  const withCountryCode = digits.startsWith("55") ? digits : `55${digits}`;
  return `https://wa.me/${withCountryCode}?text=${text}`;
}

export function buildOrderTrackingMessage(params: {
  pickupCode: string;
  trackingUrl: string;
}): string {
  return `Olá! Aqui está o link para acompanhar seu pedido: ${params.trackingUrl} — Senha: ${params.pickupCode}`;
}

export function buildBuyerSaveMessage(params: {
  lines: string[];
  totalLabel: string;
  pickupCode: string;
  trackingUrl: string;
  pixChave?: string | null;
}): string {
  const parts = ["Resumo", ...params.lines, `Total: ${params.totalLabel}`, "", `Senha: ${params.pickupCode}`];
  if (params.pixChave) parts.push("", `Pix: ${params.pixChave}`);
  parts.push("", `Acompanhe: ${params.trackingUrl}`);
  return parts.join("\n");
}

export function buildChargeMessage(params: {
  pickupCode: string;
  trackingUrl: string;
  totalLabel: string;
  pixChave?: string | null;
  paymentUrl?: string | null;
}): string {
  const lines = [`Olá! Pedido ${params.pickupCode}. Valor: ${params.totalLabel}.`];
  if (params.pixChave) lines.push(`Pix: ${params.pixChave}`);
  if (params.paymentUrl) lines.push(`Link para pagamento: ${params.paymentUrl}`);
  lines.push(`Acompanhe: ${params.trackingUrl}`);
  return lines.join("\n");
}
