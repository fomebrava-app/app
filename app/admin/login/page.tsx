"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Button, Card, Field, Input } from "@/components/ui";
import { IconAlert, IconArrowLeft } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { SignupForm } from "@/components/admin/SignupForm";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !senha.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });
    setLoading(false);

    if (authError) {
      setError("Credenciais inválidas. Verifique o e-mail e a senha.");
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image
            src="/logo.png"
            alt="Fomebrava"
            width={64}
            height={64}
            priority
            className="rounded-md"
          />
        </div>

        <Card className="p-6">
          {mode === "login" ? (
            <>
              <h1 className="text-xl font-semibold text-black">Acesso administrativo</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Entre com suas credenciais para gerenciar o cardápio.
              </p>

              {error && (
                <div className="mt-4 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
                  <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
                <Field label="E-mail" required>
                  <Input
                    type="email"
                    placeholder="voce@evento.com.br"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                </Field>

                <Field label="Senha" required>
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(e) => setSenha(e.target.value)}
                  />
                </Field>

                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-black">Criar conta</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Cadastre-se para administrar o cardápio deste evento. É
                preciso o código de acesso fornecido pelo organizador.
              </p>
              <SignupForm />
            </>
          )}

          <button
            onClick={() => setMode(mode === "login" ? "signup" : "login")}
            className="mx-auto mt-5 block text-center text-sm text-neutral-500 underline underline-offset-2 hover:text-black"
          >
            {mode === "login" ? "Não tem conta? Cadastre-se" : "Já tem conta? Entrar"}
          </button>
        </Card>

        <Link
          href="/"
          className="mx-auto mt-5 flex w-fit items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para o cardápio
        </Link>
      </div>
    </div>
  );
}
