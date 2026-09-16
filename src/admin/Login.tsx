import { useState, type FormEvent } from "react";
import { useApp } from "../store";
import { Button, Card, Field, Input } from "../components/ui";
import { IconWatch, IconAlert, IconArrowLeft } from "../components/icons";

export function Login() {
  const { navigate } = useApp();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [remember, setRemember] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [touched, setTouched] = useState(false);

  const emailInvalid = touched && !email.trim();
  const senhaInvalid = touched && !senha.trim();

  function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setTouched(true);
    setError("");
    if (!email.trim() || !senha.trim()) return;

    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      // Simulated auth: any non-matching pair shows error unless demo credentials
      if ((email === "admin@edsrelogios.com.br" || email === "admin@cronos.com.br") && senha === "123456") {
        navigate({ name: "overview" });
      } else {
        setError("Credenciais inválidas. Verifique o e-mail e a senha.");
      }
    }, 900);
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 flex flex-col items-center gap-2 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md border border-neutral-300">
            <IconWatch className="h-6 w-6 text-black" />
          </div>
          <p className="text-xl font-bold tracking-widest text-black">EDS RELÓGIOS</p>
        </div>

        <Card className="p-6">
          <h1 className="text-xl font-semibold text-black">Acesso administrativo</h1>
          <p className="mt-1 text-sm text-neutral-500">
            Entre com suas credenciais para gerenciar a loja.
          </p>

          {error && (
            <div className="mt-4 flex items-start gap-2 rounded border border-neutral-300 bg-neutral-50 px-3 py-2.5 text-sm text-neutral-700">
              <IconAlert className="mt-0.5 h-4 w-4 flex-shrink-0 text-neutral-500" />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="mt-5 space-y-4" noValidate>
            <Field
              label="E-mail"
              required
              error={emailInvalid ? "Preencha os campos obrigatórios." : ""}
            >
              <Input
                type="email"
                placeholder="voce@edsrelogios.com.br"
                value={email}
                error={emailInvalid}
                onChange={(e) => setEmail(e.target.value)}
              />
            </Field>

            <Field
              label="Senha"
              required
              error={senhaInvalid ? "Preencha os campos obrigatórios." : ""}
            >
              <Input
                type="password"
                placeholder="Digite sua senha"
                value={senha}
                error={senhaInvalid}
                onChange={(e) => setSenha(e.target.value)}
              />
            </Field>

            <div className="flex items-center justify-between">
              <label className="flex cursor-pointer items-center gap-2 text-sm text-neutral-700">
                <input
                  type="checkbox"
                  checked={remember}
                  onChange={(e) => setRemember(e.target.checked)}
                  className="h-4 w-4 rounded border-neutral-300 accent-neutral-800"
                />
                Lembrar de mim
              </label>
              <button
                type="button"
                className="text-sm text-neutral-600 underline underline-offset-2 hover:text-black"
              >
                Esqueci minha senha
              </button>
            </div>

            <Button
              type="submit"
              variant="primary"
              disabled={loading}
              className="w-full"
            >
              {loading ? "Entrando..." : "Entrar"}
            </Button>
          </form>

          <p className="mt-4 rounded border border-dashed border-neutral-300 bg-neutral-50 px-3 py-2 text-center text-[12px] text-neutral-500">
            Demonstração: admin@edsrelogios.com.br / 123456
          </p>
        </Card>

        <button
          onClick={() => navigate({ name: "landing" })}
          className="mx-auto mt-5 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" />
          Voltar para a loja
        </button>
      </div>
    </div>
  );
}
