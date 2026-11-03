import { redirect } from "next/navigation";
import { currentAdmin } from "@/server/auth/pages";
import { Brand } from "@/components/brand";
import { Card } from "@/components/ui";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata = { title: "Вход в панель студии", robots: { index: false, follow: false } };
export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return <main id="main" className="admin-login">
    <Brand compact />
    <Card className="card-pad stack"><div className="page-heading"><h1>Вход для сотрудников</h1><p className="text-muted">Введите рабочий email и пароль.</p></div><AdminLoginForm /><p className="preview-note">Публичная регистрация недоступна.</p></Card>
  </main>;
}
