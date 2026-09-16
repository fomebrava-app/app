import { useState } from "react";
import { AdminLayout } from "./AdminLayout";
import { Button, Card, Field, Input, Select, Toggle, Toast } from "../components/ui";

export function Settings() {
  const [toast, setToast] = useState("");
  const [notif, setNotif] = useState(true);
  const [lowStock, setLowStock] = useState(true);

  function save() {
    setToast("Configurações salvas com sucesso.");
    setTimeout(() => setToast(""), 2500);
  }

  return (
    <AdminLayout
      active="settings"
      title="Configurações"
      subtitle="Gerencie as informações e preferências da loja."
    >
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-2">
        <Card className="p-5">
          <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
            Dados da loja
          </h2>
          <div className="space-y-4">
            <Field label="Nome da loja">
              <Input defaultValue="EDS Relógios" />
            </Field>
            <Field label="E-mail de contato">
              <Input defaultValue="contato@edsrelogios.com.br" />
            </Field>
            <Field label="Telefone">
              <Input defaultValue="(11) 3000-0000" />
            </Field>
            <Field label="Moeda">
              <Select defaultValue="BRL">
                <option value="BRL">Real (R$)</option>
              </Select>
            </Field>
          </div>
        </Card>

        <Card className="p-5">
          <h2 className="mb-4 border-b border-neutral-200 pb-3 text-lg font-semibold text-black">
            Preferências
          </h2>
          <div className="space-y-5">
            <Toggle
              checked={notif}
              onChange={setNotif}
              label="Receber notificações por e-mail"
            />
            <Toggle
              checked={lowStock}
              onChange={setLowStock}
              label="Alertar sobre estoque baixo"
            />
            <Field label="Idioma">
              <Select defaultValue="pt-BR">
                <option value="pt-BR">Português (Brasil)</option>
              </Select>
            </Field>
            <Field label="Fuso horário">
              <Select defaultValue="brt">
                <option value="brt">Brasília (GMT-3)</option>
              </Select>
            </Field>
          </div>
        </Card>
      </div>

      <div className="mt-5 flex justify-end">
        <Button variant="primary" onClick={save}>
          Salvar alterações
        </Button>
      </div>

      <Toast message={toast} visible={!!toast} />
    </AdminLayout>
  );
}
