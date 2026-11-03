import { database } from "../database";
import { AuthError, withPermission } from "../auth/service";
import { Prisma } from "../generated/prisma/client";
import { isId, parseProduct } from "./validation";
import type { CatalogProduct } from "../../lib/catalog";

const include = { category: { select: { id: true, name: true, slug: true } }, images: { orderBy: { sortOrder: "asc" as const } }, materials: { include: { material: true }, orderBy: { material: { name: "asc" as const } } } };
type Row = Prisma.ProductGetPayload<{ include: typeof include }>;
function serialize(p: Row): CatalogProduct {
  return { id: p.id, slug: p.slug, name: p.name, description: p.description ?? "", features: p.features, calculationMode: p.calculationMode, categoryId: p.categoryId ?? "", category: p.category ?? { id: "", name: "Без категории", slug: "" }, isActive: p.isActive, sortOrder: p.sortOrder, revision: p.revision,
    images: p.images.map(({ url, alt }) => ({ url, alt })), materials: p.materials.map(({ material: m }) => ({ id: m.id, name: m.name, availability: m.availability, description: m.description })) };
}
const visible = { isActive: true, category: { isActive: true } };
export async function publicCatalog(options: { q?: string; category?: string; page?: string } = {}) {
  const q = (options.q ?? "").trim().slice(0, 100), category = (options.category ?? "").slice(0, 100);
  const page = Math.max(1, Math.min(10000, Number.parseInt(options.page ?? "1", 10) || 1));
  const where = { ...visible, ...(q ? { name: { contains: q.replace(/[\\%_]/g, "\\$&"), mode: "insensitive" as const } } : {}), ...(category ? { category: { isActive: true, slug: category } } : {}) };
  const [categories, count, rows] = await database().$transaction([
    database().category.findMany({ where: { isActive: true }, orderBy: [{ sortOrder: "asc" }, { name: "asc" }], select: { id: true, name: true, slug: true } }),
    database().product.count({ where }),
    database().product.findMany({ where, include, orderBy: [{ sortOrder: "asc" }, { id: "asc" }], take: 24, skip: (page - 1) * 24 }),
  ]);
  return { categories, products: rows.map(serialize), count, q, category, page, pages: Math.ceil(count / 24) };
}
export async function publicProduct(slug: string) {
  if (slug.length > 100) return null;
  const p = await database().product.findFirst({ where: { ...visible, slug }, include });
  if (!p) return null;
  const product = serialize(p);
  product.materials = product.materials.filter(m => m.availability !== "ARCHIVED");
  return product;
}
export async function adminCatalog() {
  const [categories, materials, products] = await database().$transaction([
    database().category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }], include: { _count: { select: { products: true } } } }),
    database().material.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, availability: true, description: true } }),
    database().product.findMany({ include, orderBy: [{ sortOrder: "asc" }, { id: "asc" }] }),
  ]);
  return { categories: categories.map(c => ({ id: c.id, name: c.name, slug: c.slug, isActive: c.isActive, sortOrder: c.sortOrder, productCount: c._count.products })), materials, products: products.map(serialize) };
}
export async function saveProduct(token: string | undefined, id: string | null, body: Record<string, unknown>) {
  if (id !== null && !isId(id)) throw new AuthError(400, "INVALID_PRODUCT", "Некорректный товар.");
  return withPermission(token, "catalog:write", async (tx, actor) => {
    const input = parseProduct(body, id !== null);
    const category = await tx.category.findUnique({ where: { id: input.categoryId } });
    if (!category || (input.isActive && !category.isActive)) throw new AuthError(400, "INVALID_CATEGORY", "Для публикации выберите активную категорию.");
    const materials = await tx.material.findMany({ where: { id: { in: input.materialIds } } });
    if (materials.length !== input.materialIds.length || materials.some(m => m.availability === "ARCHIVED")) throw new AuthError(400, "INVALID_MATERIAL", "Выберите существующие неархивные материалы.");
    if (id) await tx.$queryRaw`SELECT id FROM "Product" WHERE id = ${id}::uuid FOR UPDATE`;
    const before = id ? await tx.product.findUnique({ where: { id }, include }) : null;
    if (id && !before) throw new AuthError(404, "NOT_FOUND", "Товар не найден.");
    if (before && before.revision !== input.revision) throw new AuthError(409, "CONFLICT", "Товар уже изменён. Обновите страницу перед сохранением.");
    const { materialIds, images, revision: _revision, ...fields } = input;
    void _revision;
    const data = { ...fields, kind: input.calculationMode === "AUTO_SHEET" ? "SHEET" as const : "CUSTOM" as const, revision: before ? before.revision + 1 : 1 };
    try {
      const product = id ? await tx.product.update({ where: { id }, data }) : await tx.product.create({ data });
      if (id) { await tx.productImage.deleteMany({ where: { productId: id } }); await tx.productMaterial.deleteMany({ where: { productId: id } }); }
      await tx.productImage.createMany({ data: images.map((image, sortOrder) => ({ ...image, sortOrder, productId: product.id })) });
      await tx.productMaterial.createMany({ data: materialIds.map(materialId => ({ productId: product.id, materialId })) });
      const after = serialize((await tx.product.findUnique({ where: { id: product.id }, include }))!);
      await tx.auditLog.create({ data: { actorId: actor.id, action: before ? "catalog.product_updated" : "catalog.product_created", entityType: "Product", entityId: product.id, before: before ? JSON.parse(JSON.stringify(serialize(before))) : Prisma.DbNull, after: JSON.parse(JSON.stringify(after)) } });
      return after;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new AuthError(409, "SLUG_TAKEN", "Такой адрес товара уже используется.");
      throw error;
    }
  });
}
