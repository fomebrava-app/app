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
