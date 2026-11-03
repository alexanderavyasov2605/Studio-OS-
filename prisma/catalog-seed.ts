import type { Prisma } from "../server/generated/prisma/client";
export async function seedCatalog(tx: Prisma.TransactionClient) {
  const definitions = [
    { slug: "paper-stickers", name: "Бумажные наклейки", category: "stickers", categoryName: "Наклейки", material: "PAPER_LABEL", materialName: "Бумажная самоклейка", mode: "AUTO_SHEET" as const, description: "Бумажные этикетки для упаковки, небольших серий и фирменных деталей. Подходят для знакомства с брендом через простую выразительную форму.", features: ["Листовой формат", "Для этикеток и упаковки", "Форма по макету"] },
    { slug: "vinyl-stickers", name: "Виниловые наклейки", category: "stickers", categoryName: "Наклейки", material: "VINYL_LABEL", materialName: "Белая виниловая плёнка", mode: "MANUAL_REQUEST" as const, description: "Наклейки на белой плёнке для фирменной графики и оформления. Состав материала, стойкость и условия использования подтверждаются при ручном расчёте.", features: ["Белая основа", "Контур по макету", "Технология уточняется студией"] },
    { slug: "transparent-stickers", name: "Прозрачные наклейки", category: "stickers", categoryName: "Наклейки", material: "CLEAR_LABEL", materialName: "Прозрачная самоклеящаяся плёнка", mode: "MANUAL_REQUEST" as const, description: "Прозрачные этикетки, которые оставляют упаковку частью композиции. Печать белого цвета и особенности цветопередачи согласуются отдельно.", features: ["Прозрачная основа", "Для лаконичных этикеток", "Ручная проверка макета"] },
    { slug: "tags", name: "Бирки", category: "tags", categoryName: "Бирки", material: "TAG_CARD", materialName: "Картон для бирок", mode: "AUTO_SHEET" as const, description: "Фирменные бирки для небольших коллекций и подарочной упаковки. Добавьте историю бренда, состав или короткое обращение к покупателю.", features: ["Листовой формат", "Индивидуальная графика", "Отверстия согласуются отдельно"] },
    { slug: "packaging-cards", name: "Упаковочные карточки", category: "cards", categoryName: "Карточки", material: "PACK_CARD", materialName: "Бумага для упаковочных карточек", mode: "AUTO_SHEET" as const, description: "Простые карточки-вкладыши: благодарность, инструкция по уходу или важная деталь о продукте. Для малых серий и аккуратной упаковки.", features: ["Простой листовой формат", "Вкладыш в упаковку", "Текст и графика по макету"] },
  ];
  for (const [index, d] of definitions.entries()) {
    const id = `60000000-0000-4000-8000-00000000000${index}`;
    const category = await tx.category.upsert({ where: { slug: d.category }, update: {}, create: { slug: d.category, name: d.categoryName, isActive: true, sortOrder: index * 10 } });
    const material = await tx.material.upsert({ where: { code: d.material }, update: {}, create: { code: d.material, name: d.materialName, availability: "ON_REQUEST", description: "Под заказ. Характеристики и наличие подтверждаются студией перед расчётом." } });
    // Stable identity survives an administrator changing the public slug.
    if (!(await tx.product.findUnique({ where: { id } })) && await tx.product.findUnique({ where: { slug: d.slug } })) continue;
    await tx.product.upsert({ where: { id }, update: {}, create: {
      id, slug: d.slug, name: d.name, description: d.description, features: d.features, calculationMode: d.mode, kind: d.mode === "AUTO_SHEET" ? "SHEET" : "CUSTOM", categoryId: category.id, isActive: true, sortOrder: index * 10,
      images: { create: { url: `/catalog-art/${d.slug}.svg`, alt: `Иллюстрация: ${d.name}`, sortOrder: 0 } },
      materials: { create: { materialId: material.id } },
    } });
  }
}
