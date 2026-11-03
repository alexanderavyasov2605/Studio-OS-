import Link from "next/link";
import { Card, EmptyState } from "@/components/ui";

export default function NotFound() {
  return <main id="main" className="container public-main"><Card><EmptyState title="Страница не найдена" description="Возможно, адрес изменился или этот раздел пока недоступен." action={<Link className="button button--primary button--md" href="/">На главную</Link>} /></Card></main>;
}
