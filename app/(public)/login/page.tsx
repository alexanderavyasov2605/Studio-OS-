import { redirect } from "next/navigation";
import { currentAccount, telegramLoginAvailable } from "@/server/auth/pages";
import { Card, Alert } from "@/components/ui";
import { TelegramLogin } from "@/components/telegram-login";

export const metadata = { title: "Вход через Telegram", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";
export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const account = await currentAccount();
  if (account) redirect(account.isStaff ? "/admin" : "/account");
  const { error } = await searchParams;
  return <section className="section stack"><h1>Вход в Studio OS</h1><Card className="card-pad stack">
    {error && <Alert tone="danger" title="Вход не выполнен">{error === "throttled" ? "Слишком много попыток. Повторите позже." : "Не удалось подтвердить вход. Начните заново или повторите позже."}</Alert>}
    <TelegramLogin available={telegramLoginAvailable()} />
  </Card></section>;
}
