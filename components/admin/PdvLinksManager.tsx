"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, EmptyState, Field, Input, StatusBadge, Toast, Toggle } from "@/components/ui";
import { IconCopy, IconPOS, IconWhatsapp } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { buildWhatsAppLink } from "@/lib/whatsapp";
import type { PdvLink } from "@/lib/types";

interface LastCreated {
  label: string;
  url: string;
  password: string;
}

export function PdvLinksManager({ pdvLinks }: { pdvLinks: PdvLink[] }) {
  const router = useRouter();
  const supabase = createClient();

  const [label, setLabel] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState("");
  const [toast, setToast] = useState("");
  const [lastCreated, setLastCreated] = useState<LastCreated | null>(null);
  const [pendingId, setPendingId] = useState<string | null>(null);

  function linkUrl(token: string) {
    return `${window.location.origin}/pdv/${token}`;
  }

  async function handleGerar() {
    setErro("");
    if (!label.trim() || !password.trim()) {
      setErro("Preencha o rótulo e a senha de acesso.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/admin/pdv-links", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label: label.trim(), password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao gerar PDV.");

      setLastCreated({
        label: data.pdvLink.label,
        url: linkUrl(data.pdvLink.token),
        password,
      });
      setLabel("");
      setPassword("");
      router.refresh();
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro inesperado.");
    } finally {
      setLoading(false);
    }
  }

  async function toggleAtivo(link: PdvLink) {
    setPendingId(link.id);
    await supabase.from("pdv_links").update({ ativo: !link.ativo }).eq("id", link.id);
    setPendingId(null);
    router.refresh();
  }

  function copy(text: string) {
    navigator.clipboard.writeText(text);
    setToast("Copiado.");
    setTimeout(() => setToast(""), 2000);
  }

  return (
    <div className="space-y-6">
      <Card className="p-5">
        <h2 className="mb-4 flex items-center gap-2 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          <IconPOS className="h-5 w-5 text-neutral-500" />
          Gerar novo PDV
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Rótulo (nome da pessoa/estação)" required>
            <Input
              placeholder="Ex: Caixa 1, Fulano de tal"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
          </Field>
          <Field label="Senha de acesso" required>
            <Input
              placeholder="Senha para abrir o PDV"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </Field>
        </div>
        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
        <Button variant="primary" className="mt-4" disabled={loading} onClick={handleGerar}>
          {loading ? "Gerando..." : "Gerar PDV"}
        </Button>
      </Card>

      {lastCreated && (
        <Card className="border-neutral-800 p-5">
          <StatusBadge tone="strong">PDV gerado</StatusBadge>
          <p className="mt-3 text-sm font-medium text-black">{lastCreated.label}</p>
          <p className="mt-1 break-all text-xs text-neutral-500">{lastCreated.url}</p>
          <p className="mt-1 text-xs text-neutral-500">Senha: {lastCreated.password}</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <a
              href={buildWhatsAppLink({
                message: `Aqui está seu acesso ao PDV "${lastCreated.label}": ${lastCreated.url} — Senha: ${lastCreated.password}`,
              })}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button variant="primary">
                <IconWhatsapp className="h-4 w-4" /> Enviar por WhatsApp
              </Button>
            </a>
            <Button onClick={() => copy(`${lastCreated.url} — Senha: ${lastCreated.password}`)}>
              <IconCopy className="h-4 w-4" /> Copiar link e senha
            </Button>
          </div>
        </Card>
      )}

      <Card className="overflow-hidden">
        <h2 className="border-b border-neutral-200 px-5 py-4 text-lg font-semibold text-black">
          PDVs gerados
        </h2>
        {pdvLinks.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={<IconPOS className="h-10 w-10" />}
              title="Nenhum PDV gerado ainda."
              description="Use o formulário acima para gerar o primeiro."
            />
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-neutral-200 bg-neutral-50 text-xs uppercase tracking-wide text-neutral-500">
                <tr>
                  <th className="px-5 py-3 font-medium">Rótulo</th>
                  <th className="px-5 py-3 font-medium">Link</th>
                  <th className="px-5 py-3 font-medium">Status</th>
                  <th className="px-5 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {pdvLinks.map((link) => (
                  <tr key={link.id}>
                    <td className="px-5 py-3 font-medium text-black">{link.label}</td>
                    <td className="max-w-[240px] truncate px-5 py-3 text-neutral-500">
                      /pdv/{link.token}
                    </td>
                    <td className="px-5 py-3">
                      <StatusBadge tone={link.ativo ? "medium" : "soft"}>
                        {link.ativo ? "Ativo" : "Revogado"}
                      </StatusBadge>
                    </td>
                    <td className="flex items-center justify-end gap-3 px-5 py-3">
                      <button
                        onClick={() => copy(linkUrl(link.token))}
                        className="text-neutral-500 hover:text-black"
                        aria-label="Copiar link"
                      >
                        <IconCopy className="h-4 w-4" />
                      </button>
                      <Toggle
                        checked={link.ativo}
                        onChange={() => toggleAtivo(link)}
                      />
                      {pendingId === link.id && (
                        <span className="text-xs text-neutral-400">...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Toast message={toast} visible={!!toast} />
    </div>
  );
}
