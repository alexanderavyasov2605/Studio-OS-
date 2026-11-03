import "dotenv/config";
import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { Client } from "pg";

const url = process.env.DATABASE_TEST_URL;
if (!url) throw new Error("Set DATABASE_TEST_URL to a dedicated EMPTY PostgreSQL database. This test never resets an existing database.");
const require = createRequire(import.meta.url);
const db = new Client({ connectionString: url });
await db.connect();
let transaction = false;
let savepoint = 0;
const fixtureId = () => randomUUID();

function command(args: string[]) {
  const result = spawnSync(process.execPath, [require.resolve("prisma/build/index.js"), ...args], {
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: url },
    encoding: "utf8",
    windowsHide: true,
    timeout: 120_000,
  });
  assert.equal(result.status, 0, result.stdout + result.stderr + (result.error?.message ?? ""));
}
async function rejects(sql: string, values: unknown[], code: string) {
  const point = "constraint_" + ++savepoint;
  await db.query("SAVEPOINT " + point);
  try {
    await assert.rejects(db.query(sql, values), (error: unknown) => (error as { code?: string }).code === code);
  } finally {
    await db.query("ROLLBACK TO SAVEPOINT " + point);
    await db.query("RELEASE SAVEPOINT " + point);
  }
}
try {
  const before = await db.query("SELECT count(*)::int AS n FROM pg_tables WHERE schemaname = 'public'");
  assert.equal(before.rows[0].n, 0, "Refusing a non-empty database");
  command(["migrate", "deploy"]);
  command(["migrate", "deploy"]);
  command(["migrate", "diff", "--from-config-datasource", "--to-schema", "prisma/schema.prisma", "--exit-code"]);
  command(["db", "seed"]);
  await db.query('UPDATE "Material" SET name = $1 WHERE code = $2', ["Изменённый демонстрационный материал", "DEMO_PAPER_STICKER"]);
  await db.query('UPDATE "Product" SET name = $1, slug = $2, "isActive" = false WHERE id = $3', ["Изменённая бирка", "tags-edited", "60000000-0000-4000-8000-000000000003"]);
  command(["db", "seed"]);
  const formats = await db.query('SELECT code, "widthMm"::text, "heightMm"::text FROM "SheetFormat" ORDER BY code');
  assert.deepEqual(formats.rows.map((r) => [r.code, r.widthMm, r.heightMm]), [["A3", "297.000", "420.000"], ["A4", "210.000", "297.000"]]);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "Material"')).rows[0].n, 8);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "Material" WHERE code LIKE $1 AND availability <> $2', ["DEMO_%", "UNAVAILABLE"])).rows[0].n, 0);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "Product"')).rows[0].n, 5);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "ProductImage"')).rows[0].n, 5);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "ProductMaterial"')).rows[0].n, 5);
  const kept = (await db.query('SELECT name, slug, "isActive" FROM "Product" WHERE id = $1', ["60000000-0000-4000-8000-000000000003"])).rows[0];
  assert.deepEqual(kept, { name: "Изменённая бирка", slug: "tags-edited", isActive: false });
  await db.query('UPDATE "Product" SET name = $1, slug = $2, "isActive" = true WHERE id = $3', ["Бирки", "tags", "60000000-0000-4000-8000-000000000003"]);
  assert.equal((await db.query('SELECT name FROM "Material" WHERE code = $1', ["DEMO_PAPER_STICKER"])).rows[0].name, "Изменённый демонстрационный материал");
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "User"')).rows[0].n, 0);
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "PriceListVersion"')).rows[0].n, 0);
  console.log("PASS empty-database migration, repeat deploy and non-destructive idempotent seed");

  const rls = await db.query("SELECT bool_and(rowsecurity) AS protected FROM pg_tables WHERE schemaname = 'public' AND tablename <> '_prisma_migrations'");
  assert.equal(rls.rows[0].protected, true);
  const dates = await db.query("SELECT count(*)::int AS n FROM information_schema.columns WHERE table_schema = 'public' AND data_type = 'timestamp without time zone' AND table_name <> '_prisma_migrations'");
  assert.equal(dates.rows[0].n, 0);
  await db.query("BEGIN"); transaction = true;
  const user = fixtureId(), customer = fixtureId(), order = fixtureId(), item = fixtureId();
  await db.query('INSERT INTO "User" (id, "displayName") VALUES ($1, $2)', [user, "Тестовый сотрудник"]);
  await db.query('INSERT INTO "Customer" (id, name) VALUES ($1, $2)', [customer, "Тестовый клиент"]);
  await db.query('INSERT INTO "Order" (id, "idempotencyKey", "customerId", status, "customerSnapshot", "configurationSnapshot", "priceSnapshot", subtotal, total, "createdAt") VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $8, $9)', [
    order, fixtureId(), customer, "SUBMITTED", { label: "Анонимный тест" }, { schemaVersion: 1 }, { total: "0.30", currency: "UZS", rounding: "1" }, "0.30", "2026-11-03T12:00:00+05:00",
  ]);
  await db.query('INSERT INTO "OrderItem" (id, "orderId", position, "quantityMode", "requestedQuantity", "configurationSnapshot", "calculationSnapshot", "priceSnapshot", "lineTotal") VALUES ($1, $2, 1, $3, 1, $4, $5, $6, $7)', [
    item, order, "UNITS", { widthMm: "50", heightMm: "50" }, { billableSheets: 1 }, { total: "0.30" }, "0.30",
  ]);
  for (const amount of ["0.10", "0.20"]) await db.query('INSERT INTO "Payment" ("orderId", amount, method, status, "idempotencyKey", "verifiedById", "verifiedAt") VALUES ($1, $2, $3, $4, $5, $6, now())', [order, amount, "CASH", "CONFIRMED", fixtureId(), user]);
  assert.equal((await db.query('SELECT sum(amount)::text AS amount FROM "Payment" WHERE "orderId" = $1', [order])).rows[0].amount, "0.30");
  await rejects('INSERT INTO "Payment" ("orderId", currency, amount, method, "idempotencyKey") VALUES ($1, $2, 1, $3, $4)', [order, "USD", "CASH", fixtureId()], "23503");
  await rejects('INSERT INTO "Payment" ("orderId", amount, method, "idempotencyKey") VALUES ($1, -1, $2, $3)', [order, "CASH", fixtureId()], "23514");
  await db.query('UPDATE "Order" SET "paymentStatus" = $1 WHERE id = $2', ["PAID", order]);
  await db.query('DELETE FROM "Customer" WHERE id = $1', [customer]);
  const preserved = (await db.query('SELECT "customerId", total::text, status, "paymentStatus", "priceSnapshot", "createdAt" FROM "Order" WHERE id = $1', [order])).rows[0];
  assert.equal(preserved.customerId, null); assert.equal(preserved.total, "0.30");
  assert.equal(preserved.status, "SUBMITTED"); assert.equal(preserved.paymentStatus, "PAID");
  assert.equal(preserved.priceSnapshot.total, "0.30");
  assert.equal(preserved.createdAt.toISOString(), "2026-11-03T07:00:00.000Z");
  assert.equal((await db.query('SELECT count(*)::int AS n FROM "Payment" WHERE "orderId" = $1', [order])).rows[0].n, 2);
  await rejects('DELETE FROM "Order" WHERE id = $1', [order], "23503");
  console.log("PASS exact money, timezone-aware dates, separate payment state and retained financial history");

  const formatId = (await db.query('SELECT id FROM "SheetFormat" WHERE code = $1', ["A4"])).rows[0].id;
  const materialId = (await db.query('SELECT id FROM "Material" LIMIT 1')).rows[0].id;
  await rejects('INSERT INTO "SheetFormat" (code, name, "widthMm", "heightMm") VALUES ($1, $1, -1, 10)', ["BAD_FORMAT"], "23514");
  const profile = fixtureId(), list = fixtureId(), list2 = fixtureId(), tariff = fixtureId(), op = fixtureId();
  await db.query('INSERT INTO "ProductionProfile" (id, code, name, "sheetFormatId", "workWidthMm", "workHeightMm", "marginLeftMm", "marginRightMm", "marginTopMm", "marginBottomMm") VALUES ($1, $2, $2, $3, 190, 277, 10, 10, 10, 10)', [profile, "TEST_PROFILE", formatId]);
  await rejects('UPDATE "ProductionProfile" SET "workWidthMm" = 211 WHERE id = $1', [profile], "23514");
  await rejects('UPDATE "SheetFormat" SET "widthMm" = 200 WHERE id = $1', [formatId], "23514");
  for (const [id, version] of [[list, 1], [list2, 2]]) await db.query('INSERT INTO "PriceListVersion" (id, version, name, "validFrom") VALUES ($1, $2, $3, now())', [id, version, "Тестовый прайс"]);
  await db.query('INSERT INTO "SheetTariff" (id, "priceListVersionId", "materialId", "productionProfileId", "pricePerSheet") VALUES ($1,$2,$3,$4,18000)', [tariff, list, materialId, profile]);
  await db.query('INSERT INTO "PricingTier" ("sheetTariffId", "fromSheets", "toSheets", "pricePerSheet") VALUES ($1,1,100,18000)', [tariff]);
  await rejects('INSERT INTO "PricingTier" ("sheetTariffId", "fromSheets", "toSheets", "pricePerSheet") VALUES ($1,50,200,17000)', [tariff], "23514");
  await db.query('INSERT INTO "OperationTariff" (id, "priceListVersionId", code, name, unit, price) VALUES ($1,$2,$3,$3,$4,1000)', [op, list2, "CUT", "PER_SHEET"]);
  await rejects('INSERT INTO "SheetTariffIncludedOperation" ("sheetTariffId", "operationTariffId", "priceListVersionId") VALUES ($1,$2,$3)', [tariff, op, list], "23503");
  await db.query('UPDATE "PriceListVersion" SET status = $1, "publishedAt" = now() WHERE id = $2', ["PUBLISHED", list]);
  await rejects('UPDATE "SheetTariff" SET "pricePerSheet" = 1 WHERE id = $1', [tariff], "23514");
  await rejects('INSERT INTO "PricingTier" ("sheetTariffId", "fromSheets", "pricePerSheet") VALUES ($1,101,16000)', [tariff], "23514");
  await rejects('UPDATE "PriceListVersion" SET "minimumOrderPrice" = 10 WHERE id = $1', [list], "23514");
  console.log("PASS physical dimensions, non-overlapping sheet tiers and immutable published price versions");

  const artwork = fixtureId(), otherArtwork = fixtureId(), version = fixtureId(), otherVersion = fixtureId();
  await db.query('INSERT INTO "Artwork" (id, "orderItemId", title) VALUES ($1,$2,$3)', [artwork, item, "Тестовый макет"]);
  await db.query('INSERT INTO "Artwork" (id, title) VALUES ($1,$2)', [otherArtwork, "Другой тестовый макет"]);
  for (const [id, art] of [[version, artwork], [otherVersion, otherArtwork]]) await db.query('INSERT INTO "ArtworkVersion" (id, "artworkId", version, "sourceObjectKey", "originalFilename", "mimeType", "sizeBytes", "fileCheckStatus", "reviewStatus", "approvedById", "approvedAt") VALUES ($1,$2,1,$3,$4,$5,10,$6,$7,$8,now())', [id, art, fixtureId(), "fixture.pdf", "application/pdf", "VALID", "APPROVED", user]);
  await rejects('UPDATE "Artwork" SET status = $1, "approvedVersionId" = $2 WHERE id = $3', ["APPROVED", otherVersion, artwork], "23503");
  await db.query('UPDATE "Artwork" SET status = $1, "approvedVersionId" = $2 WHERE id = $3', ["APPROVED", version, artwork]);
  const newer = (await db.query('INSERT INTO "ArtworkVersion" ("artworkId", version, "sourceObjectKey", "originalFilename", "mimeType", "sizeBytes") VALUES ($1,2,$2,$3,$4,10) RETURNING "reviewStatus"', [artwork, fixtureId(), "fixture-v2.pdf", "application/pdf"])).rows[0];
  assert.equal(newer.reviewStatus, "UNDER_REVIEW");
  await rejects('INSERT INTO "ProductionJob" ("orderItemId", "artworkVersionId", "specificationSnapshot", "productionSheets") VALUES ($1,$2,$3,1)', [item, otherVersion, { schemaVersion: 1 }], "23514");
  await rejects('INSERT INTO "StatusHistory" (entity, "toStatus") VALUES ($1,$2)', ["ORDER", "SUBMITTED"], "23514");
  await db.query('INSERT INTO "StatusHistory" (entity, "orderId", "toStatus", "actorId") VALUES ($1,$2,$3,$4)', ["ORDER", order, "SUBMITTED", user]);
  await db.query('INSERT INTO "StatusHistory" (entity, "orderId", field, "fromStatus", "toStatus", "actorId") VALUES ($1,$2,$3,$4,$5,$6)', ["ORDER", order, "paymentStatus", "UNPAID", "PAID", user]);
  assert.deepEqual((await db.query('SELECT field FROM "StatusHistory" WHERE "orderId" = $1 ORDER BY field', [order])).rows.map((row) => row.field), ["paymentStatus", "status"]);
  await db.query('INSERT INTO "AuditLog" ("actorId", action, "entityType", "entityId") VALUES ($1,$2,$3,$4)', [user, "test.checked", "Order", order]);
  console.log("PASS artwork version ownership, no inherited approval, typed history target and RLS");
} finally {
  if (transaction) await db.query("ROLLBACK");
  await db.end();
}
