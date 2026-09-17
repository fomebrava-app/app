"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { Button, Field, Input } from "@/components/ui";
import { IconAlert, IconCheck } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { PASSWORD_RULES, isPasswordStrong } from "@/lib/password";
import { cn } from "@/lib/cn";

export function SignupForm() {
  const router = useRouter();
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [telefone, setTelefone] = useState("");
  const [inviteCode, setInviteCode] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");

    if (!fullName.trim() || !email.trim() || !telefone.trim() || !inviteCode.trim()) {
      setError("Preencha todos os campos.");
      return;
    }
    if (!isPasswordStrong(password)) {
      setError("A senha não atende aos requisitos abaixo.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          full_name: fullName,
          email,
          telefone,
          password,
          invite_code: inviteCode,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Erro ao criar conta.");

      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      if (authError) throw new Error("Conta criada, mas não foi possível entrar automaticamente. Faça login.");

      router.push("/admin");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro inesperado.");
      setLoading(false);
    }
  }

  return (
    <>
      {error && (
        <div className="mt-4 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
          <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
        <Field label="Código de acesso" required>
          <Input
            type="password"
            placeholder="Código fornecido pelo organizador"
            value={inviteCode}
            onChange={(e) => setInviteCode(e.target.value)}
          />
        </Field>

        <Field label="Nome completo" required>
          <Input
            placeholder="Seu nome completo"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
          />
        </Field>

        <Field label="E-mail" required>
          <Input
            type="email"
            placeholder="voce@evento.com.br"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </Field>

        <Field label="Telefone" required>
          <Input
            placeholder="(00) 00000-0000"
            value={telefone}
            onChange={(e) => setTelefone(e.target.value)}
          />
        </Field>

        <Field label="Senha" required>
          <Input
            type="password"
            placeholder="Crie uma senha forte"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </Field>

        <ul className="space-y-1 rounded border border-neutral-200 bg-neutral-50 px-3 py-2.5">
          {PASSWORD_RULES.map((rule) => {
            const met = rule.test(password);
            return (
              <li
                key={rule.label}
                className={cn(
                  "flex items-center gap-1.5 text-xs",
                  met ? "text-black" : "text-neutral-400"
                )}
              >
                <IconCheck className={cn("h-3.5 w-3.5", met ? "text-black" : "text-neutral-300")} />
                {rule.label}
              </li>
            );
          })}
        </ul>

        <Field label="Confirmar senha" required>
          <Input
            type="password"
            placeholder="Repita a senha"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
          />
        </Field>

        <Button type="submit" variant="primary" disabled={loading} className="w-full">
          {loading ? "Criando conta..." : "Criar conta"}
        </Button>
      </form>
    </>
  );
}
