/**
 * Acesso administrativo: entrar na loja, criar conta ou pedir nova senha.
 *
 * Com loja no perfil, o destino é `/{slug}/admin`. Sem loja, `/plataforma`
 * só abre se o servidor confirmar o admin geral. O brain não descreve esse
 * papel: brain-fomebrava/02 - Arquitetura/Multi-tenant.md e
 * brain-fomebrava/01 - Produto/Gestão.md.
 */
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, Field, Input } from "@/components/ui";
import { IconAlert } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { getUserTenantSlug } from "@/lib/user-tenant";
import { SignupForm } from "@/components/admin/SignupForm";

export default function LoginPage() {
  const router = useRouter();
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  /**
   * Entra com e-mail e senha e escolhe o destino pela loja do perfil.
   * @param e envio do formulário de login
   * Efeito: cria a sessão; sem loja e sem acesso ao painel geral, encerra a sessão.
   * A loja vem de `profiles.tenant_id`, não da URL
   * (brain-fomebrava/02 - Arquitetura/Multi-tenant.md).
   */
  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!email.trim() || !senha.trim()) {
      setError("Preencha e-mail e senha.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (authError || !authData.user) {
      setLoading(false);
      setError("Credenciais inválidas. Verifique o e-mail e a senha.");
      return;
    }

    const tenant = await getUserTenantSlug(supabase, authData.user.id);

    if (!tenant.ok) {
      if (tenant.reason === "query_error") {
        await supabase.auth.signOut();
        setLoading(false);
        console.error("login: falha ao ler a loja do perfil");
        setError("Não foi possível entrar agora, tente de novo.");
        return;
      }
      const platform = await fetch("/api/platform/me");
      if (platform.ok) {
        router.push("/plataforma");
        router.refresh();
        return;
      }
      await supabase.auth.signOut();
      setLoading(false);
      setError("Sua conta não está associada a nenhuma loja. Fale com o organizador.");
      return;
    }

    setLoading(false);

    router.push(`/${tenant.slug}/admin`);
    router.refresh();
  }

  /**
   * Pede ao Supabase o e-mail de nova senha, de volta para `/login/redefinir`.
   * @param e envio do formulário de recuperação
   * Não lê nem altera a loja do perfil. O brain não cobre recuperação de senha.
   */
  async function handleForgot(e: FormEvent) {
    e.preventDefault();
    setError("");
    setResetSent(false);
    if (!email.trim()) {
      setError("Informe o e-mail da conta.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
      redirectTo: `${window.location.origin}/login/redefinir`,
    });
    setLoading(false);

    if (resetError) {
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
          {mode === "forgot" ? (
            <>
              <h1 className="text-xl font-semibold text-black">Recuperar senha</h1>
              <p className="mt-1 text-sm text-neutral-500">
                Enviaremos um link para você escolher uma nova senha.
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
                      onChange={(e) => setEmail(e.target.value)}
                    />
                  </Field>
                  <Button type="submit" variant="primary" disabled={loading} className="w-full">
                    {loading ? "Enviando..." : "Enviar link"}
                  </Button>
                </form>
              )}
            </>
          ) : mode === "login" ? (
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
            onClick={() => {
              setError("");
              setResetSent(false);
              setMode(mode === "login" ? "signup" : "login");
            }}
            className="mx-auto mt-5 block text-center text-sm text-neutral-500 underline underline-offset-2 hover:text-black"
          >
            {mode === "signup"
              ? "Já tem conta? Entrar"
              : mode === "forgot"
                ? "Voltar ao login"
                : "Não tem conta? Cadastre-se"}
          </button>
        </Card>
      </div>
    </div>
  );
}
