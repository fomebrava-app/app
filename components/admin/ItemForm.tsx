"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import {
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  Modal,
  Select,
  Textarea,
  Toggle,
} from "@/components/ui";
import { IconUpload, IconTrash, IconPlus } from "@/components/icons";
import { createClient } from "@/lib/supabase/client";
import type { MenuCategory, MenuItem, MenuItemStatus } from "@/lib/types";

export function ItemForm({
  categories,
  item,
}: {
  categories: MenuCategory[];
  item?: MenuItem;
}) {
  const router = useRouter();
  const supabase = createClient();
  const isEditing = !!item;

  const [categoriasList, setCategoriasList] = useState(categories);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryError, setCategoryError] = useState("");

  const [nome, setNome] = useState(item?.nome ?? "");
  const [categoriaId, setCategoriaId] = useState(
    item?.categoria_id ? String(item.categoria_id) : ""
  );
  const [descricaoCurta, setDescricaoCurta] = useState(item?.descricao_curta ?? "");
  const [descricaoCompleta, setDescricaoCompleta] = useState(item?.descricao_completa ?? "");
  const [preco, setPreco] = useState(item ? String(item.preco) : "");
  const [precoPromocional, setPrecoPromocional] = useState(
    item?.preco_promocional ? String(item.preco_promocional) : ""
  );
  const [status, setStatus] = useState<MenuItemStatus>(item?.status ?? "disponivel");
  const [destaque, setDestaque] = useState(item?.destaque ?? false);
  const [imagemUrl, setImagemUrl] = useState(item?.imagem_url ?? "");

  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [erro, setErro] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    setErro("");
    try {
      const path = `${crypto.randomUUID()}-${file.name}`;
      const { error } = await supabase.storage.from("menu-images").upload(path, file);
      if (error) throw error;
      const { data } = supabase.storage.from("menu-images").getPublicUrl(path);
      setImagemUrl(data.publicUrl);
    } catch (err) {
      setErro(err instanceof Error ? err.message : "Erro ao enviar imagem.");
    } finally {
      setUploading(false);
    }
  }

  async function handleCreateCategory() {
    const nomeCategoria = newCategoryName.trim();
    if (!nomeCategoria) {
      setCategoryError("Digite um nome para a categoria.");
      return;
    }

    setCategorySaving(true);
    setCategoryError("");
    const proximaOrdem =
      categoriasList.reduce((max, c) => Math.max(max, c.ordem), 0) + 1;

    const { data, error } = await supabase
      .from("menu_categories")
      .insert({ nome: nomeCategoria, ordem: proximaOrdem })
      .select()
      .single();

    setCategorySaving(false);

    if (error) {
      setCategoryError(error.message);
      return;
    }

    setCategoriasList((prev) => [...prev, data]);
    setCategoriaId(String(data.id));
    setNewCategoryName("");
    setCategoryModalOpen(false);
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setErro("");

    if (!nome.trim() || !preco.trim()) {
      setErro("Preencha nome e preço.");
      return;
    }

    setSaving(true);
    const payload = {
      nome: nome.trim(),
      categoria_id: categoriaId ? Number(categoriaId) : null,
      descricao_curta: descricaoCurta.trim() || null,
      descricao_completa: descricaoCompleta.trim() || null,
      preco: Number(preco.replace(",", ".")),
      preco_promocional: precoPromocional
        ? Number(precoPromocional.replace(",", "."))
        : null,
      status,
      destaque,
      imagem_url: imagemUrl || null,
    };

    const result = isEditing
      ? await supabase.from("menu_items").update(payload).eq("id", item!.id)
      : await supabase.from("menu_items").insert(payload);

    setSaving(false);

    if (result.error) {
      setErro(result.error.message);
      return;
    }

    router.push("/admin/itens");
    router.refresh();
  }

  async function handleDelete() {
    if (!item) return;
    await supabase.from("menu_items").delete().eq("id", item.id);
    router.push("/admin/itens");
    router.refresh();
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-3xl space-y-5">
      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          Informações básicas
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Nome" required className="sm:col-span-2">
            <Input value={nome} onChange={(e) => setNome(e.target.value)} />
          </Field>
          <Field label="Categoria">
            <div className="flex gap-2">
              <Select
                value={categoriaId}
                onChange={(e) => setCategoriaId(e.target.value)}
                className="flex-1"
              >
                <option value="">Sem categoria</option>
                {categoriasList.map((c) => (
                  <option key={c.id} value={String(c.id)}>
                    {c.nome}
                  </option>
                ))}
              </Select>
              <Button
                type="button"
                aria-label="Nova categoria"
                onClick={() => setCategoryModalOpen(true)}
              >
                <IconPlus className="h-4 w-4" />
              </Button>
            </div>
          </Field>
          <Field label="Status">
            <Select
              value={status}
              onChange={(e) => setStatus(e.target.value as MenuItemStatus)}
            >
              <option value="disponivel">Disponível</option>
              <option value="esgotado">Esgotado</option>
              <option value="inativo">Inativo (não aparece no cardápio)</option>
            </Select>
          </Field>
          <Field label="Descrição curta" className="sm:col-span-2">
            <Input value={descricaoCurta} onChange={(e) => setDescricaoCurta(e.target.value)} />
          </Field>
          <Field label="Descrição completa" className="sm:col-span-2">
            <Textarea
              value={descricaoCompleta}
              onChange={(e) => setDescricaoCompleta(e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          Preço
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Preço" required>
            <Input inputMode="decimal" placeholder="0,00" value={preco} onChange={(e) => setPreco(e.target.value)} />
          </Field>
          <Field label="Preço promocional (opcional)">
            <Input
              inputMode="decimal"
              placeholder="0,00"
              value={precoPromocional}
              onChange={(e) => setPrecoPromocional(e.target.value)}
            />
          </Field>
        </div>
        <div className="mt-4">
          <Toggle checked={destaque} onChange={setDestaque} label="Destacar na página inicial" />
        </div>
      </Card>

      <Card className="p-5">
        <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          Foto
        </h2>
        {imagemUrl && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imagemUrl}
            alt="Prévia"
            className="mb-3 h-32 w-32 rounded border border-neutral-200 object-cover"
          />
        )}
        <label className="inline-flex cursor-pointer items-center gap-2">
          <span className="inline-flex items-center gap-2 rounded border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-black hover:bg-neutral-50">
            <IconUpload className="h-4 w-4" />
            {uploading ? "Enviando..." : "Enviar foto"}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            disabled={uploading}
            onChange={handleUpload}
          />
        </label>
      </Card>

      {erro && <p className="text-sm text-red-600">{erro}</p>}

      <div className="flex flex-wrap items-center gap-2">
        <Button type="submit" variant="primary" disabled={saving || uploading}>
          {saving ? "Salvando..." : "Salvar"}
        </Button>
        {isEditing && (
          <Button type="button" variant="danger" onClick={() => setConfirmDelete(true)}>
            <IconTrash className="h-4 w-4" /> Excluir
          </Button>
        )}
      </div>

      <ConfirmDialog
        open={confirmDelete}
        title="Excluir item"
        message="Tem certeza que deseja excluir este item do cardápio? Essa ação não pode ser desfeita."
        confirmLabel="Excluir"
        onConfirm={handleDelete}
        onClose={() => setConfirmDelete(false)}
      />

      <Modal
        open={categoryModalOpen}
        onClose={() => setCategoryModalOpen(false)}
        title="Nova categoria"
        footer={
          <>
            <Button type="button" onClick={() => setCategoryModalOpen(false)}>
              Cancelar
            </Button>
            <Button
              type="button"
              variant="primary"
              disabled={categorySaving}
              onClick={handleCreateCategory}
            >
              {categorySaving ? "Criando..." : "Criar"}
            </Button>
          </>
        }
      >
        <Field label="Nome da categoria" required>
          <Input
            autoFocus
            placeholder="Ex: Vegano"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
          />
        </Field>
        {categoryError && <p className="mt-2 text-sm text-red-600">{categoryError}</p>}
      </Modal>
    </form>
  );
}
