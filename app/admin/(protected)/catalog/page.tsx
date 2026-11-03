import { catalogAdminPage } from "@/server/catalog/admin";
import { AdminCatalog } from "@/components/admin-catalog";
export const metadata = { title: "Управление каталогом" };
export default async function Page() { return <AdminCatalog initialData={await catalogAdminPage()} />; }
