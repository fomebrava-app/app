import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Button,
  Card,
  Field,
  Input,
  Select,
  Textarea,
  Toggle,
  Toast,
} from "../components/ui";
import { useApp } from "../store";
import { products, categorias } from "../data";
import { IconUpload, IconStar, IconClose, IconArrowLeft } from "../components/icons";

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className="p-5">
      <div className="mb-4 border-b border-neutral-200 pb-3">
        <h2 className="text-lg font-semibold text-black">{title}</h2>
        {description && (
          <p className="mt-0.5 text-sm text-neutral-500">{description}</p>
        )}
      </div>
      {children}
    </Card>
  );
}

export function ProductForm({ id }: { id?: number }) {
  const { navigate } = useApp();
  const existing = id ? products.find((p) => p.id === id) : undefined;

  const [form, setForm] = useState({
    nome: existing?.nome ?? "",
    sku: existing?.sku ?? "",
    categoria: existing?.categoria ?? "",
    marca: existing?.marca ?? "Cronos",
    modelo: existing?.modelo ?? "",
    descricaoCurta: existing?.descricaoCurta ?? "",
    descricaoCompleta: existing?.descricaoCompleta ?? "",
    precoCusto: existing?.precoCusto?.toString() ?? "",
    precoVenda: existing?.precoVenda?.toString() ?? "",
    precoPromocional: existing?.precoPromocional?.toString() ?? "",
    estoque: existing?.estoque?.toString() ?? "",
    estoqueMinimo: existing?.estoqueMinimo?.toString() ?? "",
    avisarBaixo: true,
    status: existing?.status ?? "Ativo",
    exibirLoja: existing?.exibirLoja ?? true,
    destaque: existing?.destaque ?? false,
  });

  const [images, setImages] = useState<string[]>(
    existing ? [existing.imagem] : []
  );
  const [mainImage, setMainImage] = useState(0);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");

  function set<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function addSampleImage() {
    const samples = [
      "photo-1524592094714-0f0654e20314",
      "photo-1434056886845-dac89ffe9b56",
      "photo-1508057198894-247b23fe5ade",
    ];
    const seed = samples[images.length % samples.length];
    setImages([
      ...images,
      `https://images.unsplash.com/${seed}?auto=format&fit=crop&w=600&q=80`,
    ]);
  }

  function removeImage(idx: number) {
    setImages(images.filter((_, i) => i !== idx));
    if (mainImage >= images.length - 1) setMainImage(0);
  }

  function handleSave() {
    const req: Record<string, boolean> = {};
    if (!form.nome.trim()) req.nome = true;
    if (!form.sku.trim()) req.sku = true;
    if (!form.categoria) req.categoria = true;
    if (!form.precoVenda) req.precoVenda = true;
    setErrors(req);
    if (Object.keys(req).length > 0) {
      setToast("Preencha os campos obrigatórios.");
      setTimeout(() => setToast(""), 2500);
      return;
    }
    setToast("Produto salvo com sucesso.");
    setTimeout(() => {
      setToast("");
      navigate({ name: "products" });
    }, 1200);
  }

  return (
    <AdminLayout
      active="products"
      title={existing ? "Editar produto" : "Cadastrar produto"}
      subtitle={
        existing
          ? `Atualize as informações de "${existing.nome}".`
          : "Preencha as informações do novo produto."
      }
      actions={
        <Button onClick={() => navigate({ name: "products" })}>
          <IconArrowLeft className="h-4 w-4" /> Voltar
        </Button>
      }
    >
      <div className="space-y-5">
        {/* Basic information */}
        <Section
          title="Informações básicas"
          description="Dados principais de identificação do produto."
        >
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field
              label="Nome do produto"
              required
              error={errors.nome ? "Campo obrigatório." : ""}
            >
              <Input
                value={form.nome}
                error={errors.nome}
                placeholder="Ex.: Cronos Classic Steel"
                onChange={(e) => set("nome", e.target.value)}
              />
            </Field>
            <Field
              label="Código ou SKU"
              required
              error={errors.sku ? "Campo obrigatório." : ""}
            >
              <Input
                value={form.sku}
                error={errors.sku}
                placeholder="Ex.: CRN-CLS-001"
                onChange={(e) => set("sku", e.target.value)}
              />
            </Field>
            <Field
              label="Categoria"
              required
              error={errors.categoria ? "Campo obrigatório." : ""}
            >
              <Select
                value={form.categoria}
                error={errors.categoria}
                onChange={(e) => set("categoria", e.target.value)}
              >
                <option value="">Selecione uma categoria</option>
                {categorias.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="Marca">
              <Input
                value={form.marca}
                placeholder="Ex.: Cronos"
                onChange={(e) => set("marca", e.target.value)}
              />
            </Field>
            <Field label="Modelo">
              <Input
                value={form.modelo}
                placeholder="Ex.: Classic Steel 40mm"
                onChange={(e) => set("modelo", e.target.value)}
              />
            </Field>
            <Field label="Descrição curta">
              <Input
                value={form.descricaoCurta}
                placeholder="Resumo exibido nos cards"
                onChange={(e) => set("descricaoCurta", e.target.value)}
              />
            </Field>
          </div>
          <Field label="Descrição completa" className="mt-4">
            <Textarea
              value={form.descricaoCompleta}
              placeholder="Descrição detalhada exibida na página do produto"
              onChange={(e) => set("descricaoCompleta", e.target.value)}
            />
          </Field>
        </Section>

        {/* Pricing */}
        <Section title="Precificação" description="Valores em reais (R$).">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Preço de custo">
              <Input
                inputMode="decimal"
                value={form.precoCusto}
                placeholder="0,00"
                onChange={(e) => set("precoCusto", e.target.value)}
              />
            </Field>
            <Field
              label="Preço de venda"
              required
              error={errors.precoVenda ? "Campo obrigatório." : ""}
            >
              <Input
                inputMode="decimal"
                value={form.precoVenda}
                error={errors.precoVenda}
                placeholder="0,00"
                onChange={(e) => set("precoVenda", e.target.value)}
              />
            </Field>
            <Field label="Preço promocional">
              <Input
                inputMode="decimal"
                value={form.precoPromocional}
                placeholder="0,00"
                onChange={(e) => set("precoPromocional", e.target.value)}
              />
            </Field>
          </div>
        </Section>

        {/* Inventory */}
        <Section title="Estoque">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Quantidade em estoque">
              <Input
                inputMode="numeric"
                value={form.estoque}
                placeholder="0"
                onChange={(e) => set("estoque", e.target.value)}
              />
            </Field>
            <Field label="Estoque mínimo">
              <Input
                inputMode="numeric"
                value={form.estoqueMinimo}
                placeholder="0"
                onChange={(e) => set("estoqueMinimo", e.target.value)}
              />
            </Field>
            <div className="flex items-end pb-2">
              <Toggle
                checked={form.avisarBaixo}
                onChange={(v) => set("avisarBaixo", v)}
                label="Avisar quando o estoque estiver baixo"
              />
            </div>
          </div>
        </Section>

        {/* Images */}
        <Section
          title="Imagens"
          description="Adicione fotos e escolha a imagem principal."
        >
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {images.map((src, idx) => (
              <div
                key={idx}
                className={`group relative overflow-hidden rounded border ${
                  mainImage === idx ? "border-neutral-700" : "border-neutral-200"
                }`}
              >
                <img
                  src={src}
                  alt={`Imagem ${idx + 1}`}
                  className="aspect-square w-full object-cover"
                />
                <button
                  onClick={() => removeImage(idx)}
                  aria-label="Remover imagem"
                  className="absolute right-1 top-1 rounded bg-white/90 p-1 text-neutral-600 hover:text-black"
                >
                  <IconClose className="h-4 w-4" />
                </button>
                <button
                  onClick={() => setMainImage(idx)}
                  className={`absolute inset-x-0 bottom-0 flex items-center justify-center gap-1 py-1 text-[11px] font-medium ${
                    mainImage === idx
                      ? "bg-neutral-800 text-white"
                      : "bg-white/90 text-neutral-600 hover:text-black"
                  }`}
                >
                  <IconStar className="h-3 w-3" />
                  {mainImage === idx ? "Principal" : "Definir principal"}
                </button>
              </div>
            ))}
            <button
              onClick={addSampleImage}
              className="flex aspect-square flex-col items-center justify-center gap-2 rounded border border-dashed border-neutral-300 text-neutral-500 transition-colors hover:border-neutral-400 hover:bg-neutral-50"
            >
              <IconUpload className="h-6 w-6" />
              <span className="text-xs">Upload de fotos</span>
            </button>
          </div>
        </Section>

        {/* Visibility */}
        <Section title="Visibilidade">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
            <Field label="Status do produto">
              <Select
                value={form.status}
                onChange={(e) => set("status", e.target.value as typeof form.status)}
              >
                <option value="Ativo">Ativo</option>
                <option value="Inativo">Inativo</option>
                <option value="Sem estoque">Sem estoque</option>
              </Select>
            </Field>
            <div className="flex items-end pb-2">
              <Toggle
                checked={form.exibirLoja}
                onChange={(v) => set("exibirLoja", v)}
                label="Exibir na loja virtual"
              />
            </div>
            <div className="flex items-end pb-2">
              <Toggle
                checked={form.destaque}
                onChange={(v) => set("destaque", v)}
                label="Destacar na página inicial"
              />
            </div>
          </div>
        </Section>

        <div className="flex flex-wrap justify-end gap-2 pb-4">
          <Button onClick={() => navigate({ name: "products" })}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>
            Salvar produto
          </Button>
        </div>
      </div>

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}
