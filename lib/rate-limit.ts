// Limitador simples em memória — proteção básica contra abuso (força
// bruta, spam de cadastro). Por instância de função serverless: zera em
// cold start e não é compartilhado entre instâncias. Suficiente como
// primeira barreira; não substitui um limitador distribuído (Redis/tabela)
// se um dia o abuso justificar o investimento.
interface Bucket {
  count: number;
  resetAt: number;
}

const buckets = new Map<string, Bucket>();

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  const now = Date.now();
  const bucket = buckets.get(key);

  if (!bucket || now > bucket.resetAt) {
    buckets.set(key, { count: 1, resetAt: now + windowMs });
    return true;
  }

  if (bucket.count >= max) return false;

  bucket.count += 1;
  return true;
}
