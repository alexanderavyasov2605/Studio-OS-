import Link from "next/link";
import { publicCatalog } from "@/server/catalog";
import { Badge, Button, Card, EmptyState, Input, Select } from "@/components/ui";
import { CatalogImage } from "@/components/catalog-image";
import { calculationLabels } from "@/lib/catalog";
export const metadata = { title: "Каталог студии" };
export const dynamic = "force-dynamic";
export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const value = (key: string) => typeof params[key] === "string" ? params[key] as string : undefined;
  const data = await publicCatalog({ q: value("q"), category: value("category"), page: value("page") });
  const pageLink = (page: number) => "/catalog?" + new URLSearchParams({ q: data.q, category: data.category, page: String(page) });
  return <div className="stack catalog-page">
    <div className="page-heading"><Badge tone="brand">Каталог Studio OS</Badge><h1>Малые детали.<br />Большой характер.</h1><p className="text-muted">Наклейки, бирки и карточки для вашего бренда. Выберите изделие и изучите материалы.</p></div>
    <form className="catalog-filters" action="/catalog" method="get"><Input label="Поиск по названию" name="q" defaultValue={data.q} maxLength={100} placeholder="Например, наклейки" /><Select label="Категория" name="category" defaultValue={data.category}><option value="">Все категории</option>{data.categories.map(c => <option key={c.id} value={c.slug}>{c.name}</option>)}</Select><Button type="submit">Найти</Button><Link href="/catalog" className="button button--ghost">Сбросить</Link></form>
    <p className="text-muted" aria-live="polite">Найдено изделий: {data.count}</p>
    {data.products.length ? <div className="catalog-grid">{data.products.map(p => <Card className="product-card" key={p.id}><Link href={`/catalog/${p.slug}`} className="product-card__image" tabIndex={-1} aria-hidden="true"><CatalogImage image={p.images[0]} /></Link><div className="product-card__body stack"><span className="text-muted">{p.category.name}</span><h2><Link href={`/catalog/${p.slug}`}>{p.name}</Link></h2><p className="text-muted product-card__description">{p.description}</p><Badge tone={p.calculationMode === "AUTO_SHEET" ? "brand" : "neutral"}>{calculationLabels[p.calculationMode]}</Badge><Link className="button button--secondary" href={`/catalog/${p.slug}`}>Подробнее</Link></div></Card>)}</div> : <Card><EmptyState title={data.q || data.category ? "Ничего не найдено" : "Каталог пока пуст"} description="Попробуйте изменить поиск или вернитесь позже." action={<Link href="/catalog" className="button button--secondary">Сбросить фильтры</Link>} /></Card>}
    {data.pages > 1 && <nav className="catalog-pagination" aria-label="Страницы каталога">{data.page > 1 && <Link href={pageLink(data.page - 1)}>← Назад</Link>}<span>Страница {data.page} из {data.pages}</span>{data.page < data.pages && <Link href={pageLink(data.page + 1)}>Далее →</Link>}</nav>}
  </div>;
}
