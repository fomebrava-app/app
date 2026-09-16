import { useState } from "react";
import { PublicHeader } from "./PublicHeader";
import { Button, Card, EmptyState, Field, Input, Select } from "../components/ui";
import { useApp } from "../store";
import { formatBRL, estados } from "../data";
import { IconArrowLeft, IconLock, IconCart } from "../components/icons";

export function Checkout() {
  const { navigate, cart } = useApp();
  const [redirecting, setRedirecting] = useState(false);

  const subtotalGeral = cart.reduce(
    (s, i) => s + (i.product.precoPromocional ?? i.product.precoVenda) * i.quantidade,
    0
  );
  const frete = cart.length > 0 ? 29.9 : 0;
  const total = subtotalGeral + frete;

  if (cart.length === 0) {
    return (
      <div className="min-h-screen bg-white text-black">
        <PublicHeader />
        <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6">
          <EmptyState
            icon={<IconCart className="h-10 w-10" />}
            title="Seu carrinho está vazio."
            description="Adicione produtos à sacola para continuar com a compra."
            action={
              <Button variant="primary" onClick={() => navigate({ name: "landing" })}>
                Ver produtos
              </Button>
            }
          />
        </div>
      </div>
    );
  }

  function handleContinue() {
    setRedirecting(true);
    setTimeout(() => setRedirecting(false), 2000);
  }

  return (
    <div className="min-h-screen bg-white text-black">
      <PublicHeader />

      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
        <button
          onClick={() => navigate({ name: "landing" })}
          className="mb-4 flex items-center gap-1.5 text-sm text-neutral-500 hover:text-black"
        >
          <IconArrowLeft className="h-4 w-4" /> Continuar comprando
        </button>
        <h1 className="text-[28px] font-bold tracking-tight text-black">
          Resumo do pedido
        </h1>
        <p className="mt-1 text-sm text-neutral-500">
          Revise suas informações antes de prosseguir para o pagamento.
        </p>

        <div className="mt-6 grid grid-cols-1 gap-5 lg:grid-cols-3">
          {/* Forms */}
          <div className="space-y-5 lg:col-span-2">
            {/* Customer info */}
            <Card className="p-5">
              <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
                Informações do cliente
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Nome completo" required className="sm:col-span-2">
                  <Input placeholder="Seu nome completo" />
                </Field>
                <Field label="CPF" required>
                  <Input placeholder="000.000.000-00" />
                </Field>
                <Field label="Telefone" required>
                  <Input placeholder="(00) 00000-0000" />
                </Field>
                <Field label="E-mail" required className="sm:col-span-2">
                  <Input type="email" placeholder="voce@email.com" />
                </Field>
              </div>
            </Card>

            {/* Address */}
            <Card className="p-5">
              <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
                Endereço de entrega
              </h2>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="CEP" required>
                  <Input placeholder="00000-000" />
                </Field>
                <div className="hidden sm:block" />
                <Field label="Endereço" required className="sm:col-span-2">
                  <Input placeholder="Rua, avenida..." />
                </Field>
                <Field label="Número" required>
                  <Input placeholder="000" />
                </Field>
                <Field label="Complemento">
                  <Input placeholder="Apto, bloco..." />
                </Field>
                <Field label="Bairro" required>
                  <Input placeholder="Bairro" />
                </Field>
                <Field label="Cidade" required>
                  <Input placeholder="Cidade" />
                </Field>
                <Field label="Estado" required>
                  <Select defaultValue="">
                    <option value="">UF</option>
                    {estados.map((uf) => (
                      <option key={uf} value={uf}>
                        {uf}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>
            </Card>
          </div>

          {/* Order summary */}
          <div>
            <Card className="p-5 lg:sticky lg:top-24">
              <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
                Resumo da compra
              </h2>

              <ul className="space-y-4">
                {cart.map((item) => {
                  const unit =
                    item.product.precoPromocional ?? item.product.precoVenda;
                  return (
                    <li key={item.product.id} className="flex gap-3">
                      <img
                        src={item.product.imagem}
                        alt={item.product.nome}
                        className="h-14 w-14 flex-shrink-0 rounded border border-neutral-200 object-cover"
                      />
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-medium text-black">
                          {item.product.nome}
                        </p>
                        <p className="text-xs text-neutral-500">
                          Qtd: {item.quantidade} · {formatBRL(unit)}
                        </p>
                        <p className="mt-0.5 text-sm font-semibold text-black">
                          {formatBRL(unit * item.quantidade)}
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>

              <div className="mt-5 space-y-2 border-t border-neutral-200 pt-4 text-sm">
                <div className="flex justify-between text-neutral-600">
                  <span>Subtotal</span>
                  <span>{formatBRL(subtotalGeral)}</span>
                </div>
                <div className="flex justify-between text-neutral-600">
                  <span>Frete</span>
                  <span>{formatBRL(frete)}</span>
                </div>
                <div className="flex justify-between border-t border-neutral-200 pt-2 text-base font-bold text-black">
                  <span>Total</span>
                  <span>{formatBRL(total)}</span>
                </div>
              </div>

              <Button
                variant="primary"
                className="mt-5 w-full"
                disabled={redirecting}
                onClick={handleContinue}
              >
                {redirecting ? (
                  "Redirecionando..."
                ) : (
                  <>
                    <IconLock className="h-4 w-4" /> Continuar para o pagamento
                  </>
                )}
              </Button>

              <p className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs text-neutral-500">
                <IconLock className="h-3.5 w-3.5" />
                Você será direcionado para o ambiente seguro de pagamento.
              </p>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
