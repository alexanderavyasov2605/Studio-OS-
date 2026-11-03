import Link from "next/link";
import { notFound } from "next/navigation";
import { publicProduct } from "@/server/catalog";
import { Alert, Badge, Card, EmptyState } from "@/components/ui";
import { CatalogImage } from "@/components/catalog-image";
import { availabilityLabels, calculationLabels } from "@/lib/catalog";
export const dynamic = "force-dynamic";
export const metadata = { title: "Изделие студии" };
export default async function ProductPage({ params }: { params: Promise<{ slug: string }> }) {
  const product = await publicProduct((await params).slug);
  if (!product) notFound();
  return <div className="stack catalog-page"><nav aria-label="Хлебные крошки"><Link href="/catalog">Каталог</Link><span> / {product.category.name}</span></nav><div className="product-detail"><div className="stack">{product.images.map((image, i) => <CatalogImage image={image} key={i} />)}</div><div className="stack"><Badge tone="brand">{product.category.name}</Badge><h1>{product.name}</h1><p className="product-description">{product.description}</p><Badge>{calculationLabels[product.calculationMode]}</Badge>{product.features.length > 0 && <section><h2>Особенности</h2><ul>{product.features.map((feature, i) => <li key={i}>{feature}</li>)}</ul></section>}<section className="stack"><h2>Материалы</h2>{product.materials.length ? product.materials.map(m => <Card className="card-pad" key={m.id}><strong>{m.name}</strong> <Badge tone={m.availability === "AVAILABLE" ? "success" : "warning"}>{availabilityLabels[m.availability]}</Badge>{m.description && <p className="text-muted">{m.description}</p>}</Card>) : <EmptyState compact title="Материалы уточняются" description="Состав материалов будет подтверждён студией." />}</section><Link className="button button--primary" href={`/configure/${product.slug}`}>Рассчитать стоимость</Link><Alert title="Расчёт будет доступен позже">{product.calculationMode === "AUTO_SHEET" ? "Для изделия предусмотрен автоматический листовой расчёт. Калькулятор и действующие тарифы пока не подключены." : "Для изделия предусмотрена заявка на ручной расчёт. Приём заявок появится на следующем этапе."}</Alert></div></div></div>;
}
