export const calculationLabels = { AUTO_SHEET: "Автоматический листовой", MANUAL_REQUEST: "Заявка на ручной расчёт" } as const;
export type CalculationMode = keyof typeof calculationLabels;
export type CatalogImage = { url: string; alt: string };
export type CatalogMaterial = { id: string; name: string; availability: string; description: string | null };
export type CatalogProduct = {
  id: string; slug: string; name: string; description: string; features: string[];
  calculationMode: CalculationMode; isActive: boolean; sortOrder: number; revision: number;
  categoryId: string; category: { id: string; slug: string; name: string };
  images: CatalogImage[]; materials: CatalogMaterial[];
};
export type CatalogCategory = { id: string; slug: string; name: string; isActive: boolean; sortOrder: number; productCount: number };
export type CatalogInput = Pick<CatalogProduct, "slug" | "name" | "description" | "features" | "calculationMode" | "categoryId" | "isActive" | "sortOrder" | "images"> & { materialIds: string[]; revision?: number };
export type CatalogAdminData = { products: CatalogProduct[]; categories: CatalogCategory[]; materials: CatalogMaterial[]; canWrite: boolean };
export const availabilityLabels: Record<string, string> = { AVAILABLE: "Доступен", ON_REQUEST: "Под заказ", UNAVAILABLE: "Временно недоступен", ARCHIVED: "Архив" };
