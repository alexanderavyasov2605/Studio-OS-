import Link from "next/link";
import { Badge, Card, Icon } from "@/components/ui";

export const metadata = { title: "Studio OS" };
export default function HomePage() {
  return <div className="page-stack">
    <section className="hero">
      <div className="hero__copy"><Badge tone="brand"><Icon name="spark" size={14} />Пространство вашей студии</Badge><h1>Идеи обретают<br /><span>форму.</span></h1><p>Печать, макеты и заказы в одном спокойном рабочем пространстве. Сейчас мы создаём его основу.</p>
        <div className="button-row"><Link className="button button--primary button--md" href="/catalog">Перейти в каталог<Icon name="arrow" size={18} /></Link><Link className="button button--secondary button--md" href="/mini">Открыть Mini App</Link></div>
        <p className="preview-note">Страница-заглушка. Рабочие функции пока не подключены.</p>
      </div>
      <div className="hero-art" aria-hidden="true"><div className="paper paper--back" /><div className="paper paper--front"><span className="eyebrow">STUDIO / OS</span><div className="paper__shape"><span /><span /><span /></div><div className="paper__footer"><strong>От идеи<br />к воплощению.</strong><Icon name="arrow" size={28} /></div></div><span className="art-label">Создавайте. Согласуйте. Печатайте.</span></div>
    </section>
    <section aria-labelledby="workspace-title"><div className="section-heading"><div><p className="eyebrow">Одна система</p><h2 id="workspace-title">Для каждого этапа работы</h2></div><span className="text-muted text-small">Сайт · Mini App · Студия</span></div>
      <div className="grid-three">{[
        { href: "/catalog", icon: "grid" as const, title: "Каталог студии", text: "Будущие изделия, материалы и форматы печати." },
        { href: "/orders", icon: "orders" as const, title: "Ваши заказы", text: "Место для макетов, согласований и готовых тиражей." },
        { href: "/mini", icon: "layers" as const, title: "Всегда под рукой", text: "Тот же стиль и удобная навигация в Mini App." },
      ].map((item) => <Card key={item.href} className="feature-card"><span className="feature-icon"><Icon name={item.icon} /></span><h3><Link href={item.href}>{item.title}</Link></h3><p className="text-muted">{item.text}</p><Icon name="arrow" size={18} /></Card>)}</div>
    </section>
  </div>;
}
