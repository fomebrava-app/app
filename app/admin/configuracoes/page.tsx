import { AdminLayout } from "@/components/admin/AdminLayout";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { getEventSettings } from "@/lib/queries";

export default async function ConfiguracoesPage() {
  const settings = await getEventSettings();

  return (
    <AdminLayout title="Configurações" subtitle="Dados gerais do evento.">
      <SettingsForm settings={settings} />
    </AdminLayout>
  );
}
