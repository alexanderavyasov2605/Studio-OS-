import { Badge, Card, EmptyState } from "@/components/ui";

export function PlaceholderPage({ title, description }: { title: string; description: string }) {
  return <div className="page-stack">
    <div className="page-heading"><Badge tone="brand">Studio OS · Превью</Badge><h1>{title}</h1><p className="text-muted">{description}</p></div>
    <Card><EmptyState title="Раздел в подготовке" description="Страница-заглушка. Рабочие функции пока не подключены." /></Card>
  </div>;
}
