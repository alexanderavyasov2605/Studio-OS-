import { redirect } from "next/navigation";
import { currentAdmin, telegramLoginAvailable } from "@/server/auth/pages";
import { TelegramLogin } from "@/components/telegram-login";
import { Brand } from "@/components/brand";
import { Card } from "@/components/ui";
import { AdminLoginForm } from "@/components/admin-login-form";

export const metadata = { title: "Вход в панель студии", robots: { index: false, follow: false } };
export default async function LoginPage() {
  if (await currentAdmin()) redirect("/admin");
  return <main id="main" className="admin-login">
    <Brand compact />
    <Card className="card-pad stack"><div className="page-heading"><h1>Вход для сотрудников</h1><p className="text-muted">Войдите через Telegram или рабочий email.</p></div><TelegramLogin available={telegramLoginAvailable()} /><details><summary>Вход по email и паролю</summary><AdminLoginForm /></details><p className="preview-note">Доступ сотрудников проверяется сервером.</p></Card>
  </main>;
}
