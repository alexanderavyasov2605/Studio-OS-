import Link from "next/link";
import { redirect } from "next/navigation";
import { currentAccount } from "@/server/auth/pages";
import { Button, Card } from "@/components/ui";

export const dynamic = "force-dynamic";
export const metadata = { title: "Аккаунт", robots: { index: false, follow: false } };
export default async function AccountPage() {
  const account = await currentAccount();
  if (!account) redirect("/login");
  return <section className="section stack"><h1>Аккаунт</h1><Card className="card-pad stack">
    <p>Вы вошли{account.displayName ? `: ${account.displayName}` : " в Studio OS"}.</p>
    {account.isStaff && <Link href="/admin">Панель студии</Link>}
    <Link href="/catalog">Перейти в каталог</Link>
    <form action="/api/auth/logout" method="post"><Button type="submit" variant="secondary">Выйти</Button></form>
  </Card></section>;
}
