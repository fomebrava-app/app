"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, Field, Input, Textarea, Toast } from "@/components/ui";
import { createClient } from "@/lib/supabase/client";
import type { EventSettings } from "@/lib/types";

export function SettingsForm({ settings }: { settings: EventSettings }) {
  const router = useRouter();
  const supabase = createClient();
  const [eventName, setEventName] = useState(settings.event_name);
  const [whatsappNumber, setWhatsappNumber] = useState(settings.whatsapp_default_number ?? "");
  const [messageTemplate, setMessageTemplate] = useState(
    settings.whatsapp_message_template ?? ""
  );
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSaving(true);
    const { error } = await supabase
      .from("event_settings")
      .update({
        event_name: eventName.trim() || "Meu Evento",
        whatsapp_default_number: whatsappNumber.trim() || null,
        whatsapp_message_template: messageTemplate.trim() || null,
      })
      .eq("id", 1);
    setSaving(false);
    if (!error) {
      setToast("Configurações salvas.");
      setTimeout(() => setToast(""), 2000);
      router.refresh();
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-5">
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
          <Field label="Número padrão (opcional)">
            <Input
              placeholder="(00) 00000-0000"
              value={whatsappNumber}
              onChange={(e) => setWhatsappNumber(e.target.value)}
            />
          </Field>
          <Field label="Modelo de mensagem">
            <Textarea
              value={messageTemplate}
              onChange={(e) => setMessageTemplate(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Button type="submit" variant="primary" disabled={saving}>
        {saving ? "Salvando..." : "Salvar configurações"}
      </Button>

      <Toast message={toast} visible={!!toast} />
    </form>
  );
}
