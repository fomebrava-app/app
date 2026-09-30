"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import type { PlatformUser, SignupCodeInventory } from "@/lib/platform-types";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  operador_pdv: "PDV",
};

export function PlatformPanel({
  users,
  codes,
}: {
  users: PlatformUser[];
  codes: SignupCodeInventory;
}) {
  const [rows, setRows] = useState(users);
  const [inventory, setInventory] = useState(codes);
  const [freshCode, setFreshCode] = useState("");
  const [generating, setGenerating] = useState(false);
  const [codeError, setCodeError] = useState("");
  const [copied, setCopied] = useState(false);

  async function generateCode() {
    setGenerating(true);
    setCodeError("");
    setCopied(false);
    try {
      const res = await fetch("/api/platform/signup-codes", { method: "POST" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível gerar o código.");
      setFreshCode(data.code);
      setInventory((current) => ({ ...current, ready: true, available: current.available + 1 }));
    } catch (err) {
      setFreshCode("");
      setCodeError(err instanceof Error ? err.message : "Não foi possível gerar o código.");
    } finally {
      setGenerating(false);
    }
  }

  async function copyCode() {
    await navigator.clipboard.writeText(freshCode);
    setCopied(true);
  }

  return (
    <div className="space-y-8">
      <Card className="p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-xl font-semibold">Códigos de acesso</h1>
            <p className="mt-1 text-sm text-neutral-500">
              Cada código libera um cadastro de organizador e só pode ser usado uma vez.
            </p>
          </div>
          <Button type="button" variant="primary" onClick={generateCode} disabled={generating || !inventory.ready}>
            {generating ? "Gerando..." : "Gerar código"}
          </Button>
        </div>

        {!inventory.ready ? (
          <p className="mt-4 text-sm text-neutral-700">
            A tabela de códigos ainda não existe. Rode a migration 0012 no Supabase antes de gerar códigos por aqui.
          </p>
        ) : (
          <p className="mt-4 text-sm text-neutral-600">
            {inventory.available} disponíveis, {inventory.used} já usados.
          </p>
        )}

        {freshCode && (
          <div className="mt-4 flex flex-col gap-3 rounded border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-mono text-lg tracking-wide">{freshCode}</p>
              <p className="mt-1 text-xs text-neutral-500">Copie agora. Este código não aparece de novo.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={copyCode}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        )}
        {codeError && <p className="mt-3 text-sm text-red-600">{codeError}</p>}
      </Card>

      <section>
        <h2 className="text-xl font-semibold">Usuários cadastrados</h2>
        <p className="mt-1 text-sm text-neutral-500">
          O handle é a InfiniteTag, sem o $, usada no checkout daquela loja.
        </p>

        <div className="mt-4 space-y-3">
          {rows.length === 0 && (
            <Card className="p-5 text-sm text-neutral-500">Nenhuma conta cadastrada.</Card>
          )}
          {rows.map((user) => (
            <UserRow
              key={user.id}
              user={user}
              onHandleSaved={(handle) =>
                setRows((current) =>
                  current.map((row) => (row.id === user.id ? { ...row, handle } : row))
                )
              }
            />
          ))}
        </div>
      </section>
    </div>
  );
}

function UserRow({
  user,
  onHandleSaved,
}: {
  user: PlatformUser;
  onHandleSaved: (handle: string | null) => void;
}) {
  const [handle, setHandle] = useState(user.handle ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function saveHandle() {
    if (!user.tenantId) return;
    setSaving(true);
    setError("");
    setMessage("");
    try {
      const res = await fetch("/api/platform/handle", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tenantId: user.tenantId, handle }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar.");
      setHandle(data.handle ?? "");
      onHandleSaved(data.handle ?? null);
      setMessage("Handle salvo.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="p-4">
      <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr_1fr]">
        <div>
          <p className="font-medium">{user.fullName || "Sem nome"}</p>
          <p className="text-sm text-neutral-600">{user.email || "E-mail não encontrado"}</p>
          <p className="mt-1 text-xs text-neutral-500">
            {ROLE_LABEL[user.role] ?? user.role}
            {user.telefone ? ` · ${user.telefone}` : ""}
          </p>
        </div>
        <div>
          <p className="text-xs uppercase tracking-wide text-neutral-500">Loja</p>
          <p className="mt-1 text-sm">{user.slug ? `/${user.slug}` : "Sem loja"}</p>
        </div>
        <div>
          <label className="text-xs uppercase tracking-wide text-neutral-500" htmlFor={`handle-${user.id}`}>
            InfinitePay
          </label>
          {user.tenantId ? (
            <div className="mt-1 flex gap-2">
              <Input
                id={`handle-${user.id}`}
                value={handle}
                placeholder="seuhandle"
                onChange={(event) => setHandle(event.target.value)}
              />
              <Button type="button" variant="secondary" size="sm" onClick={saveHandle} disabled={saving}>
                {saving ? "Salvando" : "Salvar"}
              </Button>
            </div>
          ) : (
            <p className="mt-1 text-sm text-neutral-500">Esta conta não tem loja.</p>
          )}
          {message && <p className="mt-1 text-xs text-neutral-600">{message}</p>}
          {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
        </div>
      </div>
    </Card>
  );
}
