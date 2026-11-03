import type { CatalogInput } from "../../lib/catalog";
import { AuthError } from "../auth/service";
export const isId = (value: unknown): value is string => typeof value === "string" && /^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(value);
export function validImageUrl(value: string): boolean {
  if (/^\/catalog-art\/[a-z0-9-]+\.svg$/.test(value)) return true;
  try { const u = new URL(value); return u.protocol === "https:" && !u.username && !u.password && !u.hash && value.length <= 2048; } catch { return false; }
}
export function parseProduct(value: Record<string, unknown>, editing: boolean): CatalogInput {
  const fail = (): never => { throw new AuthError(400, "INVALID_PRODUCT", "Проверьте поля товара: название, адрес, категорию, материалы и изображения."); };
  const keys = ["slug", "name", "description", "features", "calculationMode", "categoryId", "isActive", "sortOrder", "images", "materialIds", ...(editing ? ["revision"] : [])];
  if (Object.keys(value).length !== keys.length || Object.keys(value).some(k => !keys.includes(k))) fail();
  const text = (v: unknown, min: number, max: number): v is string => typeof v === "string" && v.trim().length >= min && v.length <= max;
  if (!text(value.name, 1, 200) || !text(value.slug, 1, 100) || !/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(value.slug) || !text(value.description, 1, 10000) ||
      !isId(value.categoryId) || typeof value.isActive !== "boolean" || !Number.isInteger(value.sortOrder) || (value.sortOrder as number) < 0 || (value.sortOrder as number) > 100000 ||
      !["AUTO_SHEET", "MANUAL_REQUEST"].includes(value.calculationMode as string) ||
      !Array.isArray(value.features) || value.features.length > 12 || value.features.some(v => !text(v, 1, 200)) ||
      !Array.isArray(value.images) || value.images.length < 1 || value.images.length > 6 || value.images.some(v => !v || typeof v !== "object" || Object.keys(v).length !== 2 || !text(v.url, 1, 2048) || !validImageUrl(v.url) || !text(v.alt, 1, 200)) ||
      !Array.isArray(value.materialIds) || value.materialIds.length < 1 || value.materialIds.length > 30 || value.materialIds.some(v => !isId(v)) || new Set(value.materialIds).size !== value.materialIds.length ||
      (editing && (!Number.isInteger(value.revision) || (value.revision as number) < 1))) fail();
  const input = value as CatalogInput;
  return { ...input, name: input.name.trim(), description: input.description.trim(), features: input.features.map(v => v.trim()), images: input.images.map(v => ({ url: v.url, alt: v.alt.trim() })) };
}
