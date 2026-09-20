"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { PublicHeader } from "@/components/public/PublicHeader";
import { Button, Card, Field, Input } from "@/components/ui";

export default function BuscarPedidoPage() {
  const router = useRouter();
  const [codigo, setCodigo] = useState("");

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    const trimmed = codigo.trim();
    if (trimmed) router.push(`/pedido/${trimmed}`);
  }

  return (
    <div className="min-h-screen bg-brand-paper text-black">
      <PublicHeader />
      <div className="mx-auto max-w-md px-4 py-16 sm:px-6">
        <h1 className="text-[24px] font-bold tracking-tight text-black">
          Acompanhar pedido
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Digite a senha do seu pedido para ver o status de preparo.
        </p>
        <Card className="mt-6 p-5">
          <form onSubmit={handleSubmit} className="space-y-4">
            <Field label="Senha do pedido" required>
              <Input
                autoFocus
                inputMode="numeric"
                placeholder="0000"
                value={codigo}
                onChange={(e) => setCodigo(e.target.value)}
              />
            </Field>
            <Button type="submit" variant="primary" className="w-full">
              Ver status
            </Button>
          </form>
        </Card>
      </div>
    </div>
  );
}
