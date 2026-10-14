export function MontagemTexto({
  retirados,
  complementos,
  className = "text-xs text-neutral-500",
}: {
  retirados?: string[] | null;
  complementos?: string[] | null;
  className?: string;
}) {
  const sem = retirados ?? [];
  const com = complementos ?? [];
  if (sem.length === 0 && com.length === 0) return null;

  const texto = [
    sem.length > 0 ? `sem ${sem.join(", ")}` : null,
    com.length > 0 ? com.map((nome) => `+ ${nome}`).join(", ") : null,
  ]
    .filter(Boolean)
    .join(" · ");

  return <p className={className}>{texto}</p>;
}
