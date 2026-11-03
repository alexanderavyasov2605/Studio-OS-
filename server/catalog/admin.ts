import "server-only";
import { requireAdminPage } from "../auth/pages";
import { allowed } from "../auth/service";
import { adminCatalog } from "./service";
export async function catalogAdminPage() {
  const actor = await requireAdminPage();
  return { ...(await adminCatalog()), canWrite: allowed(actor, "catalog:write") };
}
