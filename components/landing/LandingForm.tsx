"use client";

import { useState, type FormEvent } from "react";
import { Button, Field, Input } from "@/components/ui";

const empty = {
  nome: "",
  clube: "",
  cargo: "",
  cep: "",
  email: "",
  whatsapp: "",
};

export function LandingForm() {
  const [fields, setFields] = useState(empty);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  function setField(key: keyof typeof empty, value: string) {
    setFields((current) => ({ ...current, [key]: value }));
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSending(true);
    setError("");
    try {
      const response = await fetch("/api/landing/access-request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(fields),
      });
      const data = (await response.json()) as { error?: string };
      if (!response.ok) throw new Error(data.error ?? "Não foi possível enviar a solicitação.");
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Não foi possível enviar a solicitação.");
    } finally {
      setSending(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm font-bold leading-6 text-black">
        Recebemos sua solicitação. Vamos validar o vínculo com o clube antes de liberar o acesso.
      </p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="space-y-4">
        <Field label="Nome completo" required>
          <Input
            id="landing-name"
            type="text"
            autoComplete="name"
            required
            value={fields.nome}
            onChange={(event) => setField("nome", event.target.value)}
          />
        </Field>
        <Field label="Clube" required>
          <Input
            id="landing-club"
            type="text"
            required
            value={fields.clube}
            onChange={(event) => setField("clube", event.target.value)}
          />
        </Field>
        <Field label="Cargo" required>
          <Input
            id="landing-role"
            type="text"
            required
            value={fields.cargo}
            onChange={(event) => setField("cargo", event.target.value)}
          />
        </Field>
        <Field label="CEP" required>
          <Input
            id="landing-cep"
            type="text"
            inputMode="numeric"
            autoComplete="postal-code"
            required
            value={fields.cep}
            onChange={(event) => setField("cep", event.target.value)}
          />
        </Field>
        <Field label="E-mail" required>
          <Input
            id="landing-email"
            type="email"
            autoComplete="email"
            required
            value={fields.email}
            onChange={(event) => setField("email", event.target.value)}
          />
        </Field>
        <Field label="WhatsApp" required>
          <Input
            id="landing-whatsapp"
            type="tel"
            autoComplete="tel"
            required
            value={fields.whatsapp}
            onChange={(event) => setField("whatsapp", event.target.value)}
          />
        </Field>
        <Button type="submit" variant="primary" disabled={sending}>
          {sending ? "Enviando..." : "Enviar"}
        </Button>
        {error && <p className="text-sm text-red-600">{error}</p>}
      </div>
    </form>
  );
}
