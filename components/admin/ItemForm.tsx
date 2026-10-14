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
import type {
  MenuCategory,
  MenuItem,
  MenuItemComplement,
  MenuItemIngredient,
  MenuItemStatus,
  Tenant,
} from "@/lib/types";

interface IngredientDraft {
  key: string;
  nome: string;
}

interface ComplementDraft {
  key: string;
  nome: string;
  cobra: boolean;
  preco: string;
}

export function ItemForm({
  tenant,
  categories,
  item,
  ingredients = [],
  complements = [],
}: {
  tenant: Tenant;
  categories: MenuCategory[];
  item?: MenuItem;
  ingredients?: MenuItemIngredient[];
  complements?: MenuItemComplement[];
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
  const [personalizavel, setPersonalizavel] = useState(item?.personalizavel ?? false);
  const [ingredientes, setIngredientes] = useState<IngredientDraft[]>(
    ingredients.map((ingredient) => ({ key: ingredient.id, nome: ingredient.nome }))
  );
  const [complementos, setComplementos] = useState<ComplementDraft[]>(
    complements.map((complement) => ({
      key: complement.id,
      nome: complement.nome,
      cobra: complement.cobra,
      preco: complement.preco == null ? "" : String(complement.preco),
    }))
  );
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
      const path = `${tenant.id}/${crypto.randomUUID()}-${file.name}`;
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
      .insert({ nome: nomeCategoria, ordem: proximaOrdem, tenant_id: tenant.id })
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
      personalizavel,
      imagem_url: imagemUrl || null,
    };

    const ingredientesValidos = ingredientes
      .map((ingredient) => ({ ...ingredient, nome: ingredient.nome.trim() }))
      .filter((ingredient) => ingredient.nome);
    const complementosValidos = complementos
      .map((complement) => ({ ...complement, nome: complement.nome.trim() }))
      .filter((complement) => complement.nome || complement.preco.trim());

    for (const complement of complementosValidos) {
      if (!complement.nome) {
        setSaving(false);
        setErro("Todo complemento precisa de um nome.");
        return;
      }
      if (complement.cobra) {
        const valor = Number(complement.preco.replace(",", "."));
        if (!Number.isFinite(valor) || valor < 0) {
          setSaving(false);
          setErro(`Informe o valor do acréscimo de "${complement.nome}".`);
          return;
        }
      }
    }

    const result = isEditing
      ? await supabase.from("menu_items").update(payload).eq("id", item!.id).select("id").single()
      : await supabase
          .from("menu_items")
          .insert({ ...payload, tenant_id: tenant.id })
          .select("id")
          .single();

    if (result.error || !result.data) {
      setSaving(false);
      setErro(result.error?.message ?? "Erro ao salvar o item.");
      return;
    }

    const menuItemId = result.data.id;
    const { error: deleteIngredientsError } = await supabase
      .from("menu_item_ingredients")
      .delete()
      .eq("menu_item_id", menuItemId)
      .eq("tenant_id", tenant.id);
    const { error: deleteComplementsError } = await supabase
      .from("menu_item_complements")
      .delete()
      .eq("menu_item_id", menuItemId)
      .eq("tenant_id", tenant.id);

    if (deleteIngredientsError || deleteComplementsError) {
      setSaving(false);
      setErro(deleteIngredientsError?.message ?? deleteComplementsError?.message ?? "Erro ao atualizar a personalização.");
      return;
    }

    if (ingredientesValidos.length > 0) {
      const { error } = await supabase.from("menu_item_ingredients").insert(
        ingredientesValidos.map((ingredient, index) => ({
          tenant_id: tenant.id,
          menu_item_id: menuItemId,
          nome: ingredient.nome,
          ordem: index,
        }))
      );
      if (error) {
        setSaving(false);
        setErro(error.message);
        return;
      }
    }

    if (complementosValidos.length > 0) {
      const { error } = await supabase.from("menu_item_complements").insert(
        complementosValidos.map((complement, index) => ({
          tenant_id: tenant.id,
          menu_item_id: menuItemId,
          nome: complement.nome,
          cobra: complement.cobra,
          preco: complement.cobra ? Number(complement.preco.replace(",", ".")) : null,
          ordem: index,
        }))
      );
      if (error) {
        setSaving(false);
        setErro(error.message);
        return;
      }
    }

    setSaving(false);

    router.push(`/${tenant.slug}/admin/itens`);
    router.refresh();
  }

  async function handleDelete() {
    if (!item) return;
    await supabase.from("menu_items").delete().eq("id", item.id);
    router.push(`/${tenant.slug}/admin/itens`);
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
        <h2 className="mb-2 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
          Personalização
        </h2>
        <p className="mb-4 text-sm text-neutral-500">
          As duas listas são independentes. Uma lista vazia não aparece para o cliente. Retirar
          ingrediente não muda o preço.
        </p>
        <Toggle
          checked={personalizavel}
          onChange={setPersonalizavel}
          label="Produto personalizável"
        />

        <div className="mt-5 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">Ingredientes que o cliente pode retirar</h3>
            <Button
              type="button"
              onClick={() =>
                setIngredientes((prev) => [...prev, { key: crypto.randomUUID(), nome: "" }])
              }
            >
              <IconPlus className="h-4 w-4" /> Ingrediente
            </Button>
          </div>
          {ingredientes.map((ingredient) => (
            <div key={ingredient.key} className="flex gap-2">
              <Input
                value={ingredient.nome}
                placeholder="Ex: cebola"
                onChange={(e) =>
                  setIngredientes((prev) =>
                    prev.map((row) =>
                      row.key === ingredient.key ? { ...row, nome: e.target.value } : row
                    )
                  )
                }
              />
              <Button
                type="button"
                variant="danger"
                aria-label="Remover ingrediente"
                onClick={() =>
                  setIngredientes((prev) => prev.filter((row) => row.key !== ingredient.key))
                }
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-6 space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-black">Complementos que o cliente pode incluir</h3>
            <Button
              type="button"
              onClick={() =>
                setComplementos((prev) => [
                  ...prev,
                  { key: crypto.randomUUID(), nome: "", cobra: false, preco: "" },
                ])
              }
            >
              <IconPlus className="h-4 w-4" /> Complemento
            </Button>
          </div>
          {complementos.map((complement) => (
            <div key={complement.key} className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_auto_8rem_auto]">
              <Input
                value={complement.nome}
                placeholder="Ex: queijo"
                onChange={(e) =>
                  setComplementos((prev) =>
                    prev.map((row) =>
                      row.key === complement.key ? { ...row, nome: e.target.value } : row
                    )
                  )
                }
              />
              <Toggle
                checked={complement.cobra}
                onChange={(cobra) =>
                  setComplementos((prev) =>
                    prev.map((row) =>
                      row.key === complement.key
                        ? { ...row, cobra, preco: cobra ? row.preco : "" }
                        : row
                    )
                  )
                }
                label="Cobra acréscimo"
              />
              <Input
                inputMode="decimal"
                placeholder="0,00"
                disabled={!complement.cobra}
                value={complement.preco}
                onChange={(e) =>
                  setComplementos((prev) =>
                    prev.map((row) =>
                      row.key === complement.key ? { ...row, preco: e.target.value } : row
                    )
                  )
                }
              />
              <Button
                type="button"
                variant="danger"
                aria-label="Remover complemento"
                onClick={() =>
                  setComplementos((prev) => prev.filter((row) => row.key !== complement.key))
                }
              >
                <IconTrash className="h-4 w-4" />
              </Button>
            </div>
          ))}
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
