export interface ViaCepAddress {
  cep: string;
  logradouro: string;
  bairro: string;
  localidade: string;
  uf: string;
}

export function onlyCepDigits(value: string): string {
  return value.replace(/\D/g, "").slice(0, 8);
}

export function formatCep(digits: string): string {
  if (digits.length <= 5) return digits;
  return `${digits.slice(0, 5)}-${digits.slice(5)}`;
}

export async function lookupCep(cep: string): Promise<ViaCepAddress> {
  const digits = onlyCepDigits(cep);
  if (digits.length !== 8) {
    throw new Error("Informe um CEP com 8 dígitos.");
  }

  let response: Response;
  try {
    response = await fetch(`https://viacep.com.br/ws/${digits}/json/`);
  } catch {
    throw new Error("Não foi possível consultar o CEP.");
  }

  if (!response.ok) {
    throw new Error("Não foi possível consultar o CEP.");
  }

  const data = (await response.json()) as {
    erro?: boolean;
    cep?: string;
    logradouro?: string;
    bairro?: string;
    localidade?: string;
    uf?: string;
  };

  if (data.erro) {
    throw new Error("CEP não encontrado.");
  }

  return {
    cep: data.cep || formatCep(digits),
    logradouro: data.logradouro ?? "",
    bairro: data.bairro ?? "",
    localidade: data.localidade ?? "",
    uf: data.uf ?? "",
  };
}

export function formatDeliveryAddress(params: {
  logradouro: string;
  numero: string;
  complemento: string;
  bairro: string;
  localidade: string;
  uf: string;
  cep: string;
}): string {
  const street = [params.logradouro.trim(), params.numero.trim(), params.complemento.trim()]
    .filter(Boolean)
    .join(", ");
  const city = params.localidade.trim() && params.uf.trim()
    ? `${params.localidade.trim()}/${params.uf.trim()}`
    : params.localidade.trim();
  const place = [params.bairro.trim(), city].filter(Boolean).join(", ");
  return [street, place, params.cep.trim()].filter(Boolean).join(" — ");
}
