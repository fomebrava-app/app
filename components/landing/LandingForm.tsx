"use client";

import { type FormEvent } from "react";
import { Button, Field, Input } from "@/components/ui";

export function LandingForm() {
  function handleSubmit(event: FormEvent) {
    event.preventDefault();
  }

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-sm">
      <div className="space-y-4">
        <Field label="Nome completo" required>
          <Input id="landing-name" type="text" autoComplete="name" required />
        </Field>
        <Field label="Clube" required>
          <Input id="landing-club" type="text" required />
        </Field>
        <Field label="Cargo" required>
          <Input id="landing-role" type="text" required />
        </Field>
        <Field label="CEP" required>
          <Input id="landing-cep" type="text" inputMode="numeric" autoComplete="postal-code" required />
        </Field>
        <Field label="E-mail" required>
          <Input id="landing-email" type="email" autoComplete="email" required />
        </Field>
        <Field label="WhatsApp" required>
          <Input id="landing-whatsapp" type="tel" autoComplete="tel" required />
        </Field>
        <Button type="submit" variant="primary">
          Enviar
        </Button>
      </div>
    </form>
  );
}
