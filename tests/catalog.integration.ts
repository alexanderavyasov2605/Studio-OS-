import "dotenv/config";
import assert from "node:assert/strict";
import { randomBytes, randomUUID } from "node:crypto";
import { Client } from "pg";
import { hashPassword } from "../server/auth/password";
import type { CatalogAdminData, CatalogInput, CatalogProduct } from "../lib/catalog";
const base = process.env.AUTH_TEST_BASE_URL!, origin = process.env.APP_ORIGIN!, url = process.env.DATABASE_TEST_URL!;
if (!base || !url || ![base,url].every(v => ["localhost","127.0.0.1"].includes(new URL(v).hostname))) throw new Error("Use isolated local test servers and DATABASE_TEST_URL");
const db = new Client({ connectionString: url }); await db.connect();
async function request(path: string, method = "GET", body?: unknown, cookie?: string, extra: Record<string,string> = {}) {
  return fetch(base + path, { method, redirect: "manual", headers: { ...(cookie ? { Cookie: cookie } : {}), ...(method !== "GET" ? { Origin: origin, "Sec-Fetch-Site":"same-origin", "Content-Type":"application/json" } : {}), ...extra }, ...(body ? { body:JSON.stringify(body) } : {}) });
}
async function fixture(role: "ADMIN" | "OPERATOR") {
  const id = randomUUID(), email = randomUUID()+"@example.invalid", password = randomBytes(32).toString("base64url");
  await db.query('INSERT INTO "User" (id,email,roles) VALUES ($1,$2,$3)',[id,email,[role]]);
  await db.query('INSERT INTO "AdminCredential" ("userId","passwordHash") VALUES ($1,$2)',[id,await hashPassword(password)]);
  const response = await request("/api/admin/auth/login","POST",{email,password}); assert.equal(response.status,200);
  return { id, cookie:response.headers.get("set-cookie")!.split(";")[0] };
}
try {
  const admin = await fixture("ADMIN"), operator = await fixture("OPERATOR");
  assert.equal((await request("/api/admin/catalog")).status,401);
  assert.equal((await request("/admin/catalog")).status,307);
  let response = await request("/api/admin/catalog","GET",undefined,admin.cookie);
  assert.equal(response.headers.get("cache-control"),"private, no-store");
  const data = await response.json() as CatalogAdminData;
  assert.equal(data.products.length,5); assert.equal(data.categories.length,3);
  for (const p of data.products) { assert.ok(p.images.length); assert.ok(p.materials.length); assert.ok(["AUTO_SHEET","MANUAL_REQUEST"].includes(p.calculationMode)); }
  const category = data.categories.find(c=>c.slug === "stickers")!, material = data.materials.find(m=>m.availability === "ON_REQUEST")!;
  const suffix = randomUUID().slice(0,8);
  const input: CatalogInput = { name:"Тестовое изделие "+suffix, slug:"fixture-product-"+suffix, description:"Описание <script>alert(1)</script>", features:["Тестовая особенность"], categoryId:category.id, materialIds:[material.id], calculationMode:"MANUAL_REQUEST", isActive:true, sortOrder:0, images:[{url:"/catalog-art/tags.svg",alt:"Тестовая иллюстрация"}] };
  assert.equal((await request("/api/admin/catalog/products","POST",input)).status,401);
  assert.equal((await request("/api/admin/catalog/products","POST",input,operator.cookie)).status,403);
  assert.equal((await request("/api/admin/catalog/products","POST",input,admin.cookie,{Origin:"https://untrusted.invalid"})).status,403);
  assert.equal((await request("/api/admin/catalog/products","POST",{...input,roles:["ADMIN"]},admin.cookie)).status,400);
  assert.equal((await request("/api/admin/catalog/products","POST",{...input,images:[{url:"javascript:alert(1)",alt:"X"}]},admin.cookie)).status,400);
  response = await request("/api/admin/catalog/products","POST",input,admin.cookie); assert.equal(response.status,201);
  let product = await response.json() as CatalogProduct;
  assert.equal(product.revision,1);
  assert.equal((await request("/api/admin/catalog/products","POST",input,admin.cookie)).status,409);
  let html = await (await request("/catalog/"+product.slug)).text();
  assert.ok(html.includes(input.name)); assert.ok(html.includes("Тестовая особенность")); assert.ok(html.includes("Заявка на ручной расчёт")); assert.ok(html.includes(`/configure/${product.slug}`)); assert.ok(!html.includes("<script>alert(1)</script>"));
  html = await (await request("/catalog?q="+encodeURIComponent(suffix)+"&category=stickers")).text(); assert.ok(html.includes(input.name));
  html = await (await request("/catalog?q="+encodeURIComponent(suffix)+"&category=cards")).text(); assert.ok(html.includes("Ничего не найдено")); assert.ok(!html.includes(input.name));
  html = await (await request("/catalog?q=%25")).text(); assert.ok(html.includes("Ничего не найдено"));
  assert.equal((await request("/catalog/nonexistent-"+suffix)).status,404);
  const updated = {...input,description:"Обновлённое описание",calculationMode:"AUTO_SHEET",sortOrder:100,revision:product.revision};
  response = await request(`/api/admin/catalog/products/${product.id}`,"PUT",updated,admin.cookie); assert.equal(response.status,200); product = await response.json();
  assert.equal((await request(`/api/admin/catalog/products/${product.id}`,"PUT",updated,admin.cookie)).status,409);
  html = await (await request("/catalog/"+product.slug)).text(); assert.ok(html.includes("Обновлённое описание")); assert.ok(html.includes("Автоматический листовой"));
  const ordered = await (await request("/api/admin/catalog","GET",undefined,admin.cookie)).json() as CatalogAdminData;
  assert.equal(ordered.products.at(-1)?.id,product.id);
  response = await request(`/api/admin/catalog/products/${product.id}`,"PUT",{...updated,revision:product.revision,isActive:false},admin.cookie); assert.equal(response.status,200); product = await response.json();
  assert.equal((await request("/catalog/"+product.slug)).status,404);
  html = await (await request("/catalog?q="+suffix)).text(); assert.ok(!html.includes(input.name));
  await db.query('UPDATE "User" SET permissions = $1 WHERE id = $2',[["catalog:write"],operator.id]);
  response = await request(`/api/admin/catalog/products/${product.id}`,"PUT",{...updated,revision:product.revision,isActive:true},operator.cookie); assert.equal(response.status,200); product = await response.json();
  await db.query('UPDATE "User" SET permissions = $1 WHERE id = $2',[[],operator.id]);
  assert.equal((await request(`/api/admin/catalog/products/${product.id}`,"PUT",{...updated,revision:product.revision},operator.cookie)).status,403);
  await db.query('UPDATE "Category" SET "isActive" = false WHERE id = $1',[category.id]);
  assert.equal((await request("/catalog/"+product.slug)).status,404);
  assert.equal((await request(`/api/admin/catalog/products/${product.id}`,"PUT",{...updated,revision:product.revision},admin.cookie)).status,400);
  await db.query('UPDATE "Category" SET "isActive" = true WHERE id = $1',[category.id]);
  const audits = await db.query('SELECT action, "after" FROM "AuditLog" WHERE "entityId" = $1 ORDER BY "createdAt"',[product.id]);
  assert.equal(audits.rows[0].action,"catalog.product_created"); assert.ok(audits.rows.some(r=>r.action === "catalog.product_updated" && r.after.description === "Обновлённое описание"));
  console.log("PASS catalog create-to-public without rebuild, edits, category/name filters, literal search, sort, visibility and 404");
  console.log("PASS catalog role/permission checks, CSRF, validation, duplicate slug, optimistic concurrency and transactional audit");
} finally { await db.end(); }
