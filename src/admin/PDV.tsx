import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Button,
  Card,
  Field,
  Input,
  Toast,
} from "../components/ui";
import { products, customers, formatBRL, type Product } from "../data";
import { IconSearch, IconBox, IconClose, IconPOS } from "../components/icons";

export function PDV() {
  const [produtoQuery, setProdutoQuery] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [clienteQuery, setClienteQuery] = useState("");
  const [clienteSelecionado, setClienteSelecionado] = useState<string>("");
  const [quantidade, setQuantidade] = useState("1");
  const [desconto, setDesconto] = useState("");
  const [toast, setToast] = useState("");

  const produtoSugestoes = useMemo(() => {
    if (!produtoQuery.trim() || selectedProduct) return [];
    const q = produtoQuery.toLowerCase();
    return products
      .filter(
        (p) =>
          p.nome.toLowerCase().includes(q) || p.sku.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [produtoQuery, selectedProduct]);

  const clienteSugestoes = useMemo(() => {
    if (!clienteQuery.trim() || clienteSelecionado) return [];
    const q = clienteQuery.toLowerCase();
    return customers
      .filter(
        (c) =>
          c.nome.toLowerCase().includes(q) || c.cpf.toLowerCase().includes(q)
      )
      .slice(0, 5);
  }, [clienteQuery, clienteSelecionado]);

  const valorUnitario = selectedProduct
    ? selectedProduct.precoPromocional ?? selectedProduct.precoVenda
    : 0;

  const descontoNumerico = Number(desconto.replace(",", ".")) || 0;
  const quantidadeNumerica = Number(quantidade) || 0;
  const totalVenda = Math.max(
    valorUnitario * quantidadeNumerica - descontoNumerico,
    0
  );

  function handleSelectProduct(p: Product) {
    setSelectedProduct(p);
    setProdutoQuery(p.nome);
  }

  function handleClearProduct() {
    setSelectedProduct(null);
    setProdutoQuery("");
  }

  function handleSelectCliente(nome: string) {
    setClienteSelecionado(nome);
    setClienteQuery(nome);
  }

  function handleClearCliente() {
    setClienteSelecionado("");
    setClienteQuery("");
  }

  function resetForm() {
    setProdutoQuery("");
    setSelectedProduct(null);
    setClienteQuery("");
    setClienteSelecionado("");
    setQuantidade("1");
    setDesconto("");
  }

  function handleRegistrarVenda() {
    if (!selectedProduct || !clienteSelecionado) {
      setToast("Preencha os campos obrigatórios.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setToast("Venda registrada com sucesso.");
    setTimeout(() => {
      setToast("");
      resetForm();
    }, 1600);
  }

  return (
    <AdminLayout active="pdv" title="PDV" subtitle="Registre uma venda de forma rápida.">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-3">
        {/* Sales form */}
        <div className="space-y-5 lg:col-span-2">
          <Card className="p-5">
            <h2 className="mb-4 flex items-center gap-2 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
              <IconPOS className="h-5 w-5 text-neutral-500" />
              Nova venda
            </h2>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {/* Localizar produto */}
              <Field label="Localizar produto" required className="sm:col-span-2">
                <div className="relative">
                  <div className="relative">
                    <IconSearch className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
                    <Input
                      value={produtoQuery}
                      placeholder="Buscar por nome ou SKU..."
                      className="pl-9 pr-9"
                      onChange={(e) => {
                        setProdutoQuery(e.target.value);
                        if (selectedProduct) setSelectedProduct(null);
                      }}
                    />
                    {selectedProduct && (
                      <button
                        onClick={handleClearProduct}
                        aria-label="Limpar produto selecionado"
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                      >
                        <IconClose className="h-4 w-4" />
                      </button>
                    )}
                  </div>

                  {produtoSugestoes.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
                      {produtoSugestoes.map((p) => (
                        <button
                          key={p.id}
                          onClick={() => handleSelectProduct(p)}
                          className="flex w-full items-center gap-3 border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50"
                        >
                          <img
                            src={p.imagem}
                            alt={p.nome}
                            className="h-8 w-8 flex-shrink-0 rounded border border-neutral-200 object-cover"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-medium text-black">
                              {p.nome}
                            </p>
                            <p className="text-xs text-neutral-500">{p.sku}</p>
                          </div>
                          <span className="text-sm font-semibold text-black">
                            {formatBRL(p.precoPromocional ?? p.precoVenda)}
                          </span>
                        </button>
                      ))}
                    </div>
                  )}

                  {produtoQuery.trim() &&
                    !selectedProduct &&
                    produtoSugestoes.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-500 shadow-sm">
                        Nenhum produto encontrado.
                      </div>
                    )}
                </div>
              </Field>

              {/* Cliente */}
              <Field label="Cliente" required className="sm:col-span-2">
                <div className="relative">
                  <Input
                    value={clienteQuery}
                    placeholder="Nome ou CPF do cliente..."
                    className="pr-9"
                    onChange={(e) => {
                      setClienteQuery(e.target.value);
                      if (clienteSelecionado) setClienteSelecionado("");
                    }}
                  />
                  {clienteSelecionado && (
                    <button
                      onClick={handleClearCliente}
                      aria-label="Limpar cliente selecionado"
                      className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-black"
                    >
                      <IconClose className="h-4 w-4" />
                    </button>
                  )}

                  {clienteSugestoes.length > 0 && (
                    <div className="absolute z-10 mt-1 w-full overflow-hidden rounded border border-neutral-200 bg-white shadow-sm">
                      {clienteSugestoes.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => handleSelectCliente(c.nome)}
                          className="flex w-full flex-col border-b border-neutral-100 px-3 py-2 text-left last:border-0 hover:bg-neutral-50"
                        >
                          <span className="text-sm font-medium text-black">
                            {c.nome}
                          </span>
                          <span className="text-xs text-neutral-500">{c.cpf}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {clienteQuery.trim() &&
                    !clienteSelecionado &&
                    clienteSugestoes.length === 0 && (
                      <div className="absolute z-10 mt-1 w-full rounded border border-neutral-200 bg-white px-3 py-3 text-sm text-neutral-500 shadow-sm">
                        Nenhum cliente encontrado.
                      </div>
                    )}
                </div>
              </Field>

              <Field label="Quantidade" required>
                <Input
                  inputMode="numeric"
                  value={quantidade}
                  placeholder="1"
                  onChange={(e) => setQuantidade(e.target.value)}
                />
              </Field>

              <Field label="Valor unitário">
                <Input
                  readOnly
                  value={selectedProduct ? formatBRL(valorUnitario) : ""}
                  placeholder="Selecione um produto"
                  className="cursor-not-allowed bg-neutral-50 text-neutral-600"
                />
              </Field>

              <Field label="Desconto" className="sm:col-span-2">
                <Input
                  inputMode="decimal"
                  value={desconto}
                  placeholder="0,00"
                  onChange={(e) => setDesconto(e.target.value)}
                />
              </Field>
            </div>
          </Card>

          {/* Selected product info */}
          <Card className="p-5">
            <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
              Produto selecionado
            </h2>
            {selectedProduct ? (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                <img
                  src={selectedProduct.imagem}
                  alt={selectedProduct.nome}
                  className="h-20 w-20 flex-shrink-0 rounded border border-neutral-200 object-cover"
                />
                <div className="grid flex-1 grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
                  <InfoItem label="Nome do produto" value={selectedProduct.nome} />
                  <InfoItem label="Código ou SKU" value={selectedProduct.sku} />
                  <InfoItem
                    label="Valor unitário"
                    value={formatBRL(valorUnitario)}
                  />
                  <InfoItem
                    label="Estoque disponível"
                    value={`${selectedProduct.estoque} unidade(s)`}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center gap-2 py-8 text-center text-neutral-500">
                <IconBox className="h-8 w-8 text-neutral-300" />
                <p className="text-sm">
                  Nenhum produto selecionado. Utilize o campo acima para localizar
                  um produto.
                </p>
              </div>
            )}
          </Card>
        </div>

        {/* Sale summary */}
        <div>
          <Card className="p-5 lg:sticky lg:top-24">
            <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
              Resumo da venda
            </h2>

            <dl className="space-y-3 text-sm">
              <SummaryRow
                label="Produto"
                value={selectedProduct ? selectedProduct.nome : "—"}
              />
              <SummaryRow
                label="Cliente"
                value={clienteSelecionado || "—"}
              />
              <SummaryRow
                label="Quantidade"
                value={quantidadeNumerica > 0 ? `${quantidadeNumerica} un.` : "—"}
              />
              <SummaryRow
                label="Valor unitário"
                value={selectedProduct ? formatBRL(valorUnitario) : "—"}
              />
              <SummaryRow
                label="Desconto"
                value={formatBRL(descontoNumerico)}
              />
            </dl>

            <div className="mt-4 flex items-center justify-between border-t border-neutral-200 pt-4">
              <span className="text-base font-semibold text-black">
                Total da venda
              </span>
              <span className="text-2xl font-bold text-black">
                {formatBRL(totalVenda)}
              </span>
            </div>

            <div className="mt-5 flex flex-col gap-2">
              <Button variant="primary" onClick={handleRegistrarVenda}>
                Registrar venda
              </Button>
              <Button onClick={resetForm}>Cancelar</Button>
            </div>
          </Card>
        </div>
      </div>

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}

function InfoItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </p>
      <p className="mt-0.5 text-sm font-medium text-black">{value}</p>
    </div>
  );
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-neutral-500">{label}</dt>
      <dd className="max-w-[60%] truncate text-right font-medium text-black">
        {value}
      </dd>
    </div>
  );
}
