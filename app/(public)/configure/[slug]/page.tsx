import { PlaceholderPage } from "@/components/placeholder-page";

export const metadata = { title: "Конфигуратор" };

export default async function ConfigurePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  return (
    <PlaceholderPage
      title="Конфигуратор"
      description={`Маршрут изделия: ${slug}. Параметры печати и расчёт стоимости будут добавлены позже.`}
    />
  );
}
