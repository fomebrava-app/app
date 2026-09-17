"use client";

import { useState, type FormEvent } from "react";
import { Button, Card, EmptyState, Field, Input } from "@/components/ui";
import { IconAlert, IconLock, IconPOS } from "@/components/icons";
import { PdvSaleForm } from "@/components/pdv/PdvSaleForm";
import type { MenuItem } from "@/lib/types";

export function PdvGate({
  token,
  label,
  ativo,
  items,
}: {
  token: string;
  label: string;
  ativo: boolean;
  items: MenuItem[];
}) {
  const [password, setPassword] = useState("");
  const [unlockedPassword, setUnlockedPassword] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!password.trim()) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/pdv/${token}/auth`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Senha incorreta.");
      setUnlockedPassword(password);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  if (!ativo) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4">
        <EmptyState
          icon={<IconAlert className="h-10 w-10" />}
          title="Este PDV foi revogado."
          description="Peça ao administrador do evento um novo link de acesso."
        />
      </div>
    );
  }

  if (unlockedPassword) {
    return (
      <div className="min-h-screen bg-white px-4 py-8 sm:px-6">
        <div className="mx-auto mb-6 max-w-6xl">
          <h1 className="text-[22px] font-bold tracking-tight text-black">{label}</h1>
          <p className="text-sm text-neutral-500">Ponto de venda</p>
        </div>
        <div className="mx-auto max-w-6xl">
          <PdvSaleForm items={items} pdvToken={token} pdvPassword={unlockedPassword} />
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-neutral-300">
            <IconPOS className="h-6 w-6 text-black" />
          </div>
          <p className="text-xl font-bold tracking-widest text-black">{label.toUpperCase()}</p>
        </div>

        <Card className="p-6">
          <h1 className="text-xl font-semibold text-black">Acesso ao PDV</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Digite a senha de acesso para abrir o ponto de venda.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
              <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <Field label="Senha de acesso" required>
              <Input
                type="password"
                autoFocus
                placeholder="Digite a senha"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </Field>

            <Button type="submit" variant="primary" disabled={loading} className="w-full">
              {loading ? (
                "Verificando..."
              ) : (
                <>
                  <IconLock className="h-4 w-4" /> Entrar
                </>
              )}
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
