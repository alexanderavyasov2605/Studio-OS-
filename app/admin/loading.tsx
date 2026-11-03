import { Card, Skeleton } from "@/components/ui";

export default function Loading() {
  return <main id="main" className="container public-main"><Card className="card-pad"><Skeleton label="Загрузка страницы" /></Card></main>;
}
