import type { ReactNode } from "react";
import { requireAdminPage } from "@/server/auth/pages";
import { AdminShell } from "@/components/admin-shell";

export default async function ProtectedAdminLayout({ children }: { children: ReactNode }) {
  const actor = await requireAdminPage();
  return <AdminShell staff={{ email: actor.email, role: actor.role }}>{children}</AdminShell>;
}
