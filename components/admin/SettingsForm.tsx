"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea, Toast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { EventSettings, Tenant } from "@/lib/types";

export function SettingsForm({
  tenant,
  settings,
}: {
  tenant: Tenant;
  settings: EventSettings;
}) {
  const router = useRouter();
  const supabase = createClient();
  const [eventName, setEventName] = useState(settings.event_name);
  const [messageTemplate, setMessageTemplate] = useState(
    settings.whatsapp_message_template ?? ""
  );
  const [infinitepayHandle, setInfinitepayHandle] = useState(tenant.infinitepay_handle ?? "");
  const [infinitepayEmail, setInfinitepayEmail] = useState(
    tenant.infinitepay_default_customer_email ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");
  const [erro, setErro] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErro("");

    const [settingsResult, tenantResult] = await Promise.all([
      supabase
        .from("event_settings")
        .update({
          event_name: eventName.trim() || "Meu Evento",
          whatsapp_message_template: messageTemplate.trim() || null,
        })
        .eq("id", settings.id),
      supabase
        .from("tenants")
        .update({
          infinitepay_handle: infinitepayHandle.trim() || null,
          infinitepay_default_customer_email: infinitepayEmail.trim() || null,
        })
        .eq("id", tenant.id),
    ]);

    setSaving(false);
    const error = settingsResult.error ?? tenantResult.error;
    if (error) {
      setErro(error.message);
      return;
    }
    setToast("Configurações salvas.");
    setTimeout(() => setToast(""), 2000);
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          Evento
        </h2>
        <Field label="Nome do evento" required>
          <Input value={eventName} onChange={(e) => setEventName(e.target.value)} />
        </Field>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          WhatsApp
        </h2>
        <div className="space-y-4">
          <Field label="Modelo de mensagem">
            <Textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          InfinitePay
        </h2>
        <div className="space-y-4">
          <Field label="Handle (InfiniteTag, sem o símbolo $)" required>
            <Input
              placeholder="seuhandle"
              value={infinitepayHandle}
              onChange={(e) => setInfinitepayHandle(e.target.value)}
            />
          </Field>
          <Field label="E-mail padrão do cliente (opcional)">
            <Input
              type="email"
              placeholder="contato@seuclube.com.br"
              value={infinitepayEmail}
              onChange={(e) => setInfinitepayEmail(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>

      <Toast message={toast} visible={!!toast} />
    </form>
  );
}
