"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, Field, Input } from "@/components/ui";
import { IconAlert } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { clearAuthNext, markPlatformPasswordReset } from "@/lib/auth-next";

export function PlatformLogin() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");
    if (!email.trim() || !senha.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    await supabase.auth.signOut({ scope: "local" });
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: email.trim(),
      password: senha,
    });
    if (authError) {
      setLoading(false);
      setError("Credenciais inválidas. Verifique o e-mail e a senha.");
      return;
    }

    const platform = await fetch("/api/platform/me");
    const body = (await platform.json().catch(() => ({}))) as { reason?: string };
    if (body.reason === "not_admin") {
      await supabase.auth.signOut({ scope: "local" });
      setLoading(false);
      setError("Esta conta não administra o painel do sistema.");
      return;
    }
    if (!platform.ok) {
      setLoading(false);
      setError("Não foi possível confirmar o acesso. Tente entrar de novo.");
      return;
    }

    router.refresh();
  }

  async function handleForgot(event: FormEvent) {
    event.preventDefault();
    setError("");
    setResetSent(false);
    if (!email.trim()) {
      setError("Informe o e-mail da conta.");
      return;
    }

    setLoading(true);
    markPlatformPasswordReset();
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login/redefinir?next=/plataforma`,
    });
    setLoading(false);

    if (resetError) {
      clearAuthNext();
      const denied = resetError.message.toLowerCase().includes("redirect");
      setError(
        denied
          ? "Não foi possível enviar o e-mail agora. Tente de novo em alguns minutos."
          : "Não foi possível enviar o e-mail. Tente de novo."
      );
      return;
    }

    setResetSent(true);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image src="/logo.png" alt="Fomebrava" width={64} height={64} priority className="rounded-md" />
        </div>
        <Card className="p-6">
          {mode === "forgot" ? (
            <>
              <h1 className="text-xl font-semibold text-black">Recuperar senha</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Enviaremos um link para você escolher uma nova senha do painel.
              </p>
              {error && (
                <div className="mt-4 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
                  <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
                  {error}
                </div>
              )}
              {resetSent ? (
                <p className="mt-5 text-sm text-neutral-700">
                  Se este e-mail estiver cadastrado, enviamos um link para criar uma nova senha.
                  Abra a mensagem e use o mesmo navegador.
                </p>
              ) : (
                <form onSubmit={handleForgot} className="mt-5 space-y-4" noValidate>
                  <Field label="E-mail" required>
                    <Input
                      type="email"
                      placeholder="voce@evento.com.br"
                      value={email}
                      onChange={(event) => setEmail(event.target.value)}
                    />
                  </Field>
                  <Button type="submit" variant="primary" disabled={loading} className="w-full">
                    {loading ? "Enviando..." : "Enviar link"}
                  </Button>
                </form>
              )}
            </>
          ) : (
            <>
              <h1 className="text-xl font-semibold text-black">Painel geral</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Entre com o e-mail autorizado a administrar o sistema.
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
                    onChange={(event) => setEmail(event.target.value)}
                  />
                </Field>
                <Field label="Senha" required>
                  <Input
                    type="password"
                    placeholder="Digite sua senha"
                    value={senha}
                    onChange={(event) => setSenha(event.target.value)}
                  />
                </Field>
                <button
                  type="button"
                  onClick={() => {
                    setError("");
                    setResetSent(false);
                    setMode("forgot");
                  }}
                  className="block text-sm text-neutral-500 underline underline-offset-2 hover:text-black"
                >
                  Esqueci a senha
                </button>
                <Button type="submit" variant="primary" disabled={loading} className="w-full">
                  {loading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </>
          )}
          {mode === "forgot" && (
            <button
              type="button"
              onClick={() => {
                setError("");
                setResetSent(false);
                setMode("login");
              }}
              className="mx-auto mt-5 block text-center text-sm text-neutral-500 underline underline-offset-2 hover:text-black"
            >
              Voltar ao login
            </button>
          )}
        </Card>
      </div>
    </div>
  );
}
