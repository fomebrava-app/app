"use client";

import { useEffect, useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Button, Card, Field, Input } from "@/components/ui";
import { IconAlert, IconCheck } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import { getUserTenantSlug } from "@/lib/user-tenant";
import { PASSWORD_RULES, isPasswordStrong } from "@/lib/password";
import { cn } from "@/lib/cn";

export default function RedefinirSenhaPage() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const supabase = createClient();
    let active = true;

    async function establish() {
      const params = new URLSearchParams(window.location.search);
      const code = params.get("code");
      const tokenHash = params.get("token_hash");
      const type = params.get("type");

      if (code) {
        const { error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (!active) return;
        setChecking(false);
        if (exchangeError) {
          setError("Este link é inválido ou expirou. Peça um novo e-mail na tela de login.");
          return;
        }
        setReady(true);
        return;
      }

      if (tokenHash && type === "recovery") {
        const { error: otpError } = await supabase.auth.verifyOtp({
          token_hash: tokenHash,
          type: "recovery",
        });
        if (!active) return;
        setChecking(false);
        if (otpError) {
          setError("Este link é inválido ou expirou. Peça um novo e-mail na tela de login.");
          return;
        }
        setReady(true);
        return;
      }

      const { data } = await supabase.auth.getSession();
      if (!active) return;
      setChecking(false);
      if (data.session) setReady(true);
      else setError("Abra o link enviado por e-mail para escolher a nova senha.");
    }

    const { data: subscription } = supabase.auth.onAuthStateChange((event) => {
      if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
        setReady(true);
        setChecking(false);
        setError("");
      }
    });

    establish();
    return () => {
      active = false;
      subscription.subscription.unsubscribe();
    };
  }, []);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError("");
    if (!isPasswordStrong(password)) {
      setError("A senha não atende aos requisitos abaixo.");
      return;
    }
    if (password !== confirmPassword) {
      setError("As senhas não coincidem.");
      return;
    }

    setLoading(true);
    const supabase = createClient();
    const { data, error: updateError } = await supabase.auth.updateUser({ password });
    if (updateError || !data.user) {
      setLoading(false);
      setError("Não foi possível salvar a nova senha. Peça um novo link.");
      return;
    }

    const tenant = await getUserTenantSlug(supabase, data.user.id);
    if (tenant.ok) {
      router.push(`/${tenant.slug}/admin`);
      router.refresh();
      return;
    }

    const platform = await fetch("/api/platform/me");
    setLoading(false);
    if (platform.ok) {
      router.push("/plataforma");
      router.refresh();
      return;
    }

    await supabase.auth.signOut();
    setError("Senha atualizada. Entre de novo com a nova senha.");
    setReady(false);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-brand-paper px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <Image src="/logo.png" alt="Fomebrava" width={64} height={64} priority className="rounded-md" />
        </div>
        <Card className="p-6">
          <h1 className="text-xl font-semibold text-black">Nova senha</h1>
          <p className="mt-1 text-sm text-neutral-500">Escolha uma senha para entrar na sua conta.</p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
              <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
              {error}
            </div>
          )}

          {checking ? (
            <p className="mt-5 text-sm text-neutral-500">Conferindo o link...</p>
          ) : ready ? (
            <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
              <Field label="Nova senha" required>
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
                      className={cn("flex items-center gap-1.5 text-xs", met ? "text-black" : "text-neutral-400")}
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
                {loading ? "Salvando..." : "Salvar senha"}
              </Button>
            </form>
          ) : (
            <a
              href="/login"
              className="mt-5 block text-center text-sm text-neutral-500 underline underline-offset-2 hover:text-black"
            >
              Voltar ao login
            </a>
          )}
        </Card>
      </div>
    </div>
  );
}
