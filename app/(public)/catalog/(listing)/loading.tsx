import { Card, Skeleton } from "@/components/ui";
export default function Loading() { return <div className="stack"><h1>Каталог</h1><Skeleton label="Загрузка каталога" /><div className="catalog-grid">{[1,2,3].map(i => <Card className="card-pad" key={i}><Skeleton /></Card>)}</div></div>; }
