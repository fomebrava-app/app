"use client";

import { useState } from "react";
import { Button, Card, Input } from "@/components/ui";
import { formatCep } from "@/lib/viacep";
import { isValidTenantSlug, normalizeTenantSlug, normalizeTenantSlugInput } from "@/lib/tenant-slug";
import type { LandingAccessInbox, LandingAccessRequest, PlatformUser } from "@/lib/platform-types";

const ROLE_LABEL: Record<string, string> = {
  admin: "Administrador",
  operador_pdv: "PDV",
};

export function PlatformPanel({
  users,
  requests,
}: {
  users: PlatformUser[];
  requests: LandingAccessInbox;
}) {
  const [rows, setRows] = useState(users);
  const [received, setReceived] = useState(requests.requests);

  function replaceRequest(next: LandingAccessRequest) {
    setReceived((current) => current.map((item) => (item.id === next.id ? next : item)));
  }

  return (
    <div className="space-y-8">
      <section>
        <h2 className="text-xl font-semibold">Respostas recebidas</h2>
        <p className="mt-1 text-sm text-neutral-500">
          Solicitações enviadas pelo formulário da página inicial.
        </p>
        <div className="mt-4 space-y-3">
          {!requests.ready && (
            <Card className="p-5 text-sm text-neutral-700">
              A tabela de solicitações ainda não existe. Rode a migration 0016 no Supabase.
            </Card>
          )}
          {requests.ready && received.length === 0 && (
            <Card className="p-5 text-sm text-neutral-500">
              Ainda não chegou nenhuma solicitação.
            </Card>
          )}
          {received.map((request) => (
            <RequestCard
              key={request.id}
              request={request}
              onChange={replaceRequest}
              onRegistered={(user) => setRows((current) => [user, ...current])}
            />
          ))}
        </div>
      </section>

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

function RequestCard({
  request,
  onChange,
  onRegistered,
}: {
  request: LandingAccessRequest;
  onChange: (next: LandingAccessRequest) => void;
  onRegistered: (user: PlatformUser) => void;
}) {
  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(request.email);
  const [alias, setAlias] = useState("");
  const [savingEmail, setSavingEmail] = useState(false);
  const [registering, setRegistering] = useState(false);
  const [error, setError] = useState("");
  const [password, setPassword] = useState("");
  const [copied, setCopied] = useState(false);
  const slug = normalizeTenantSlug(alias);
  const registered = Boolean(request.registeredAt);

  async function saveEmail() {
    setSavingEmail(true);
    setError("");
    try {
      const res = await fetch("/api/platform/access-requests", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, email }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível salvar o e-mail.");
      onChange({ ...request, email: data.email });
      setEmail(data.email);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível salvar o e-mail.");
    } finally {
      setSavingEmail(false);
    }
  }

  async function registerStore() {
    setRegistering(true);
    setError("");
    try {
      const res = await fetch("/api/platform/access-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: request.id, alias: slug }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Não foi possível cadastrar a loja.");
      setPassword(data.password);
      onChange({ ...request, registeredAt: data.registeredAt });
      onRegistered(data.user);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível cadastrar a loja.");
    } finally {
      setRegistering(false);
    }
  }

  async function copyPassword() {
    await navigator.clipboard.writeText(password);
    setCopied(true);
  }

  return (
    <Card className="p-4">
      <div className="flex flex-col gap-1 sm:flex-row sm:items-baseline sm:justify-between">
        <p className="font-medium">{request.nome}</p>
        <p className="text-xs text-neutral-500">
          {new Date(request.createdAt).toLocaleString("pt-BR", {
            dateStyle: "short",
            timeStyle: "short",
            timeZone: "America/Sao_Paulo",
          })}
        </p>
      </div>
      <p className="mt-1 text-sm text-neutral-700">
        {request.clube} · {request.cargo}
      </p>
      <p className="mt-1 text-sm text-neutral-600">{request.whatsapp}</p>
      <p className="mt-1 text-xs text-neutral-500">CEP {formatCep(request.cep)}</p>

      <div className="mt-4 space-y-3">
        {editing ? (
          <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              aria-label="E-mail"
            />
            <Button type="button" variant="secondary" size="sm" onClick={saveEmail} disabled={savingEmail}>
              {savingEmail ? "Salvando" : "Salvar"}
            </Button>
          </div>
        ) : (
          <div className="flex flex-wrap items-center gap-3">
            <p className="text-sm text-neutral-700">{request.email}</p>
            {!registered && (
              <Button type="button" variant="secondary" size="sm" onClick={() => setEditing(true)}>
                Editar e-mail
              </Button>
            )}
          </div>
        )}

        {registered ? (
          <p className="text-sm font-medium text-black">Loja cadastrada.</p>
        ) : (
          <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
            <label className="block flex-1 text-xs text-neutral-500">
              Alias da loja
              <Input
                className="mt-1"
                value={alias}
                placeholder="nome-do-clube"
                onChange={(event) => setAlias(normalizeTenantSlugInput(event.target.value))}
              />
            </label>
            <Button
              type="button"
              variant="primary"
              disabled={registering || !isValidTenantSlug(slug)}
              onClick={registerStore}
            >
              {registering ? "Cadastrando..." : "Cadastrar"}
            </Button>
          </div>
        )}

        {password && (
          <div className="flex flex-col gap-3 rounded border border-neutral-200 bg-neutral-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-xs text-neutral-500">Senha provisória</p>
              <p className="font-mono text-lg tracking-wide">{password}</p>
              <p className="mt-1 text-xs text-neutral-500">Copie agora. Esta senha não aparece de novo.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={copyPassword}>
              {copied ? "Copiado" : "Copiar"}
            </Button>
          </div>
        )}
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </Card>
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
