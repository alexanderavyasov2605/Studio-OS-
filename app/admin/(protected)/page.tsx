import { requireAdminPage } from "@/server/auth/pages";
import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "Администрирование" };
export default async function Page() {
  await requireAdminPage();
  return <PlaceholderPage title="Администрирование" description="Вход защищён. Управление заказами и производственная доска появятся на следующих этапах." />;
}
