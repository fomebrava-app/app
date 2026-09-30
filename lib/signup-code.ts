import { createHash, randomInt } from "crypto";

// Sem 0/O e 1/I, para o código ditado por telefone não ser lido errado.
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function canonicalSignupCode(input: string): string | null {
  const raw = input.toUpperCase().replace(/[^A-Z0-9]/g, "");
  if (raw.length !== 12) return null;
  if ([...raw].some((char) => !ALPHABET.includes(char))) return null;
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}

export function hashSignupCode(canonical: string): string {
  return createHash("sha256").update(canonical).digest("hex");
}

export function generateSignupCode(): string {
  let raw = "";
  for (let i = 0; i < 12; i++) raw += ALPHABET[randomInt(ALPHABET.length)];
  return `${raw.slice(0, 4)}-${raw.slice(4, 8)}-${raw.slice(8)}`;
}
