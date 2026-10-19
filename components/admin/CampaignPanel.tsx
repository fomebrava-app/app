"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { Campaign, CampaignRecebimento } from "@/lib/types";

export function CampaignPanel({
  tenantSlug,
  openCampaign,
}: {
  tenantSlug: string;
  openCampaign: Campaign | null;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [nome, setNome] = useState("");
  const [recebimento, setRecebimento] = useState<CampaignRecebimento>("infinitepay");
  const [pixChave, setPixChave] = useState("");
  const [reserva, setReserva] = useState(false);
  const [usaCozinha, setUsaCozinha] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");

  async function handleCreate(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro("");
    const { error } = await supabase.rpc("create_campaign", {
      p_tenant_slug: tenantSlug,
      p_nome: nome.trim(),
      p_recebimento: recebimento,
      p_pix_chave: recebimento === "pix" ? pixChave.trim() : null,
      p_reserva: reserva,
      p_usa_cozinha: reserva && usaCozinha,
    });
    setSaving(false);
    if (error) {
      setErro(error.message);
      return;
    }
    setNome("");
    setPixChave("");
    setReserva(false);
    setUsaCozinha(false);
    router.refresh();
  }

  async function handleClose() {
    if (!openCampaign) return;
    const confirmed = window.confirm(
      "Finalizar a campanha fecha pedidos, despesas e mudanças de status deste período. Continuar?"
    );
    if (!confirmed) return;
    setSaving(true);
    setErro("");
    const { error } = await supabase.rpc("close_campaign", {
      p_campaign_id: openCampaign.id,
    });
    setSaving(false);
    if (error) {
      setErro(error.message);
      return;
    }
    router.refresh();
  }

  if (openCampaign) {
    return (
      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          Campanha aberta
        </h2>
        <dl className="space-y-2 text-sm text-neutral-700">
          <div>
            <dt className="text-neutral-500">Nome</dt>
            <dd className="font-medium text-black">{openCampaign.nome}</dd>
          </div>
          <div>
            <dt className="text-neutral-500">Recebimento</dt>
            <dd className="font-medium text-black">
              {openCampaign.recebimento === "pix" ? "Pix no WhatsApp" : "InfinitePay"}
            </dd>
          </div>
          {openCampaign.recebimento === "pix" && (
            <div>
              <dt className="text-neutral-500">Chave Pix</dt>
              <dd className="font-medium text-black">{openCampaign.pix_chave}</dd>
            </div>
          )}
          <div>
            <dt className="text-neutral-500">Reserva antes do pagamento</dt>
            <dd className="font-medium text-black">
              {openCampaign.reserva_antes_pagamento ? "Sim" : "Não"}
            </dd>
          </div>
          {openCampaign.reserva_antes_pagamento && (
            <div>
              <dt className="text-neutral-500">Cozinha na reserva</dt>
              <dd className="font-medium text-black">
                {openCampaign.usa_cozinha ? "Sim" : "Não"}
              </dd>
            </div>
          )}
        </dl>
        {erro && <p className="mt-3 text-sm text-red-600">{erro}</p>}
        <Button className="mt-4" disabled={saving} onClick={handleClose}>
          {saving ? "Finalizando..." : "Finalizar campanha"}
        </Button>
      </Card>
    );
  }

  return (
    <Card className="p-5">
      <h2 className="mb-1 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
        Nova campanha
      </h2>
      <p className="mb-4 text-sm text-neutral-500">
        Não há campanha aberta. A próxima começa um período novo, sem misturar a
        movimentação anterior.
      </p>
      <form onSubmit={handleCreate} className="space-y-4">
        <Field label="Nome da campanha" required>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} />
        </Field>
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium text-black">Recebimento</legend>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="radio"
              name="recebimento"
              checked={recebimento === "infinitepay"}
              onChange={() => setRecebimento("infinitepay")}
            />
            InfinitePay
          </label>
          <label className="flex items-center gap-2 text-sm text-neutral-800">
            <input
              type="radio"
              name="recebimento"
              checked={recebimento === "pix"}
              onChange={() => setRecebimento("pix")}
            />
            Pix no WhatsApp
          </label>
        </fieldset>
        {recebimento === "pix" && (
          <Field label="Chave Pix" required>
            <Input
              value={pixChave}
              onChange={(e) => setPixChave(e.target.value)}
              placeholder="E-mail, telefone, CPF ou aleatória"
            />
          </Field>
        )}
        <label className="flex items-start gap-2 text-sm text-neutral-800">
          <input
            type="checkbox"
            className="mt-1"
            checked={reserva}
            onChange={(e) => {
              setReserva(e.target.checked);
              if (!e.target.checked) setUsaCozinha(false);
            }}
          />
          <span>
            Reserva antes do pagamento. O cliente reserva, escolhe receber ou retirar
            e paga depois.
          </span>
        </label>
        {reserva && (
          <label className="flex items-start gap-2 text-sm text-neutral-800">
            <input
              type="checkbox"
              className="mt-1"
              checked={usaCozinha}
              onChange={(e) => setUsaCozinha(e.target.checked)}
            />
            <span>
              Usar a cozinha. O pedido aparece em Recebido assim que o cliente reservar.
            </span>
          </label>
        )}
        {erro && <p className="text-sm text-red-600">{erro}</p>}
        <Button type="submit" variant="primary" disabled={saving}>
          {saving ? "Abrindo..." : "Nova campanha"}
        </Button>
      </form>
    </Card>
  );
}
