import { useMemo, useState } from "react";
import { AdminLayout } from "./AdminLayout";
import {
  Button,
  Card,
  ConfirmDialog,
  EmptyState,
  Field,
  Input,
  Modal,
  SearchField,
  Select,
  Textarea,
  Toast,
} from "../components/ui";
import { customers as initial, estados, type Customer } from "../data";
import {
  IconPlus,
  IconEye,
  IconEdit,
  IconTrash,
  IconUsers,
} from "../components/icons";

const emptyForm = {
  nome: "",
  cpf: "",
  email: "",
  telefone: "",
  cep: "",
  endereco: "",
  numero: "",
  complemento: "",
  bairro: "",
  cidade: "",
  estado: "",
  observacoes: "",
};

export function Customers() {
  const [list, setList] = useState<Customer[]>(initial);
  const [search, setSearch] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [viewCustomer, setViewCustomer] = useState<Customer | null>(null);
  const [editId, setEditId] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<Customer | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState<Record<string, boolean>>({});
  const [toast, setToast] = useState("");

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return list.filter(
      (c) =>
        !q ||
        c.nome.toLowerCase().includes(q) ||
        c.cpf.includes(q) ||
        c.email.toLowerCase().includes(q)
    );
  }, [list, search]);

  function openNew() {
    setForm(emptyForm);
    setEditId(null);
    setErrors({});
    setModalOpen(true);
  }

  function openEdit(c: Customer) {
    setForm({
      ...emptyForm,
      nome: c.nome,
      cpf: c.cpf,
      email: c.email,
      telefone: c.telefone,
      cidade: c.cidade,
      estado: c.estado,
    });
    setEditId(c.id);
    setErrors({});
    setModalOpen(true);
  }

  function handleSave() {
    const req: Record<string, boolean> = {};
    if (!form.nome.trim()) req.nome = true;
    if (!form.cpf.trim()) req.cpf = true;
    if (!form.email.trim()) req.email = true;
    setErrors(req);
    if (Object.keys(req).length > 0) return;

    if (editId) {
      setList(
        list.map((c) =>
          c.id === editId
            ? {
                ...c,
                nome: form.nome,
                cpf: form.cpf,
                email: form.email,
                telefone: form.telefone,
                cidade: form.cidade,
                estado: form.estado,
              }
            : c
        )
      );
      setToast("Cliente atualizado com sucesso.");
    } else {
      setList([
        {
          id: Math.max(0, ...list.map((c) => c.id)) + 1,
          nome: form.nome,
          cpf: form.cpf,
          email: form.email,
          telefone: form.telefone,
          cidade: form.cidade,
          estado: form.estado,
          cadastro: "02/08/2026",
        },
        ...list,
      ]);
      setToast("Cliente cadastrado com sucesso.");
    }
    setModalOpen(false);
    setTimeout(() => setToast(""), 2500);
  }

  function confirmDelete() {
    if (!toDelete) return;
    setList(list.filter((c) => c.id !== toDelete.id));
    setToDelete(null);
    setToast("Cliente excluído com sucesso.");
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <AdminLayout
      active="customers"
      title="Clientes"
      subtitle={`${filtered.length} cliente(s) encontrado(s)`}
      actions={
        <Button variant="primary" onClick={openNew}>
          <IconPlus className="h-4 w-4" /> Cadastrar cliente
        </Button>
      }
    >
      <Card className="mb-5 p-4">
        <Field label="Buscar">
          <SearchField
            value={search}
            onChange={setSearch}
            placeholder="Nome, CPF ou e-mail..."
            className="max-w-md"
          />
        </Field>
      </Card>

      {filtered.length === 0 ? (
        <EmptyState
          icon={<IconUsers className="h-10 w-10" />}
          title="Nenhum cliente encontrado."
          description="Ajuste a busca ou cadastre um novo cliente."
          action={
            <Button variant="primary" onClick={openNew}>
              <IconPlus className="h-4 w-4" /> Cadastrar cliente
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full min-w-[900px] text-left">
              <thead>
                <tr className="border-b border-neutral-300 text-[12px] uppercase tracking-wide text-neutral-500">
                  <th className="px-4 py-3 font-medium">Nome</th>
                  <th className="px-4 py-3 font-medium">CPF</th>
                  <th className="px-4 py-3 font-medium">Telefone</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Cidade</th>
                  <th className="px-4 py-3 font-medium">Estado</th>
                  <th className="px-4 py-3 font-medium">Cadastro</th>
                  <th className="px-4 py-3 text-right font-medium">Ações</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c) => (
                  <tr
                    key={c.id}
                    className="border-b border-neutral-100 text-sm last:border-0 hover:bg-neutral-50"
                  >
                    <td className="px-4 py-3 font-medium text-black">{c.nome}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.cpf}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.telefone}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.email}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.cidade}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.estado}</td>
                    <td className="px-4 py-3 text-neutral-600">{c.cadastro}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <ActionBtn label="Visualizar" onClick={() => setViewCustomer(c)}>
                          <IconEye className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn label="Editar" onClick={() => openEdit(c)}>
                          <IconEdit className="h-4 w-4" />
                        </ActionBtn>
                        <ActionBtn label="Excluir" onClick={() => setToDelete(c)}>
                          <IconTrash className="h-4 w-4" />
                        </ActionBtn>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Register / edit modal */}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editId ? "Editar cliente" : "Cadastrar cliente"}
        size="lg"
        footer={
          <>
            <Button onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button variant="primary" onClick={handleSave}>
              Salvar cliente
            </Button>
          </>
        }
      >
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field
            label="Nome completo"
            required
            className="sm:col-span-2"
            error={errors.nome ? "Campo obrigatório." : ""}
          >
            <Input
              value={form.nome}
              error={errors.nome}
              placeholder="Nome do cliente"
              onChange={(e) => setForm({ ...form, nome: e.target.value })}
            />
          </Field>
          <Field label="CPF" required error={errors.cpf ? "Campo obrigatório." : ""}>
            <Input
              value={form.cpf}
              error={errors.cpf}
              placeholder="000.000.000-00"
              onChange={(e) => setForm({ ...form, cpf: e.target.value })}
            />
          </Field>
          <Field
            label="E-mail"
            required
            error={errors.email ? "Campo obrigatório." : ""}
          >
            <Input
              type="email"
              value={form.email}
              error={errors.email}
              placeholder="cliente@email.com"
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
          </Field>
          <Field label="Telefone">
            <Input
              value={form.telefone}
              placeholder="(00) 00000-0000"
              onChange={(e) => setForm({ ...form, telefone: e.target.value })}
            />
          </Field>
          <Field label="CEP">
            <Input
              value={form.cep}
              placeholder="00000-000"
              onChange={(e) => setForm({ ...form, cep: e.target.value })}
            />
          </Field>
          <Field label="Endereço" className="sm:col-span-2">
            <Input
              value={form.endereco}
              placeholder="Rua, avenida..."
              onChange={(e) => setForm({ ...form, endereco: e.target.value })}
            />
          </Field>
          <Field label="Número">
            <Input
              value={form.numero}
              placeholder="000"
              onChange={(e) => setForm({ ...form, numero: e.target.value })}
            />
          </Field>
          <Field label="Complemento">
            <Input
              value={form.complemento}
              placeholder="Apto, bloco..."
              onChange={(e) => setForm({ ...form, complemento: e.target.value })}
            />
          </Field>
          <Field label="Bairro">
            <Input
              value={form.bairro}
              placeholder="Bairro"
              onChange={(e) => setForm({ ...form, bairro: e.target.value })}
            />
          </Field>
          <Field label="Cidade">
            <Input
              value={form.cidade}
              placeholder="Cidade"
              onChange={(e) => setForm({ ...form, cidade: e.target.value })}
            />
          </Field>
          <Field label="Estado">
            <Select
              value={form.estado}
              onChange={(e) => setForm({ ...form, estado: e.target.value })}
            >
              <option value="">UF</option>
              {estados.map((uf) => (
                <option key={uf} value={uf}>
                  {uf}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Observações" className="sm:col-span-2">
            <Textarea
              value={form.observacoes}
              placeholder="Observações adicionais (opcional)"
              onChange={(e) => setForm({ ...form, observacoes: e.target.value })}
            />
          </Field>
        </div>
      </Modal>

      {/* View modal */}
      <Modal
        open={!!viewCustomer}
        onClose={() => setViewCustomer(null)}
        title="Detalhes do cliente"
        footer={<Button onClick={() => setViewCustomer(null)}>Fechar</Button>}
      >
        {viewCustomer && (
          <dl className="grid grid-cols-1 gap-x-6 gap-y-3 sm:grid-cols-2">
            <Detail label="Nome" value={viewCustomer.nome} />
            <Detail label="CPF" value={viewCustomer.cpf} />
            <Detail label="E-mail" value={viewCustomer.email} />
            <Detail label="Telefone" value={viewCustomer.telefone} />
            <Detail label="Cidade" value={viewCustomer.cidade} />
            <Detail label="Estado" value={viewCustomer.estado} />
            <Detail label="Data de cadastro" value={viewCustomer.cadastro} />
          </dl>
        )}
      </Modal>

      <ConfirmDialog
        open={!!toDelete}
        title="Excluir cliente"
        message={`Tem certeza de que deseja excluir este cliente? "${toDelete?.nome}" será removido permanentemente.`}
        confirmLabel="Excluir"
        onConfirm={confirmDelete}
        onClose={() => setToDelete(null)}
      />

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}

function ActionBtn({
  children,
  label,
  onClick,
}: {
  children: React.ReactNode;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      title={label}
      aria-label={label}
      className="rounded border border-transparent p-1.5 text-neutral-500 transition-colors hover:border-neutral-300 hover:bg-neutral-50 hover:text-black"
    >
      {children}
    </button>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-[12px] font-medium uppercase tracking-wide text-neutral-500">
        {label}
      </dt>
      <dd className="mt-0.5 text-sm text-black">{value}</dd>
    </div>
  );
}
