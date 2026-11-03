import "dotenv/config";
import assert from "node:assert/strict";
import { createHash, randomBytes, randomUUID } from "node:crypto";
import { spawnSync } from "node:child_process";
import { createRequire } from "node:module";
import { Client } from "pg";
import { hashPassword } from "../server/auth/password";

const base = process.env.AUTH_TEST_BASE_URL;
const url = process.env.DATABASE_TEST_URL;
if (!base || !url || !["localhost", "127.0.0.1"].includes(new URL(base).hostname)) throw new Error("Use a local test server and a dedicated migrated DATABASE_TEST_URL");
const origin = process.env.APP_ORIGIN!;
const require = createRequire(import.meta.url);
const db = new Client({ connectionString: url });
await db.connect();
const password = randomBytes(32).toString("base64url");
const operatorPassword = randomBytes(32).toString("base64url");
const adminEmail = "admin-" + randomUUID() + "@example.invalid";
const operatorEmail = "operator-" + randomUUID() + "@example.invalid";
const fixedOrigin = { Origin: origin, "Sec-Fetch-Site": "same-origin" };
async function request(path: string, method = "GET", body?: unknown, cookie?: string, extra: Record<string, string> = {}) {
  return fetch(base + path, {
    method, redirect: "manual", headers: {
      ...(method !== "GET" ? { ...fixedOrigin, "Content-Type": "application/json" } : {}),
      ...(cookie ? { Cookie: cookie } : {}), ...extra,
    },
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
}
function cookie(response: Response) {
  const value = response.headers.getSetCookie().find((item) => item.startsWith("__Host-studio_admin="));
  assert.ok(value, "Production session cookie");
  assert.match(value, /HttpOnly/i); assert.match(value, /Secure/i); assert.match(value, /SameSite=Strict/i);
  assert.match(value, /Path=\//i); assert.doesNotMatch(value, /Domain=/i);
  return value.split(";")[0];
}
function bootstrap(email: string, pass: string) {
  return spawnSync(process.execPath, [require.resolve("tsx/cli"), "scripts/bootstrap-admin.ts"], {
    cwd: process.cwd(), env: { ...process.env, DATABASE_URL: url, ADMIN_EMAIL: email, ADMIN_PASSWORD: pass },
    encoding: "utf8", windowsHide: true, timeout: 60000,
  });
}
try {
  for (const table of ["User", "Order", "Customer", "AdminCredential"]) {
    assert.equal((await db.query('SELECT count(*)::int AS n FROM "' + table + '"')).rows[0].n, 0, "Refusing an occupied database");
  }
  const clientId = randomUUID(), clientEmail = "client-" + randomUUID() + "@example.invalid";
  await db.query('INSERT INTO "User" (id,email) VALUES ($1,$2)', [clientId, clientEmail]);
  assert.notEqual(bootstrap(clientEmail, password).status, 0, "Bootstrap cannot elevate an existing client");
  assert.deepEqual((await db.query('SELECT roles::text[] AS roles FROM "User" WHERE id=$1', [clientId])).rows[0].roles, ["CLIENT"]);
  const setup = bootstrap(adminEmail, password);
  assert.equal(setup.status, 0, (setup.stderr + (setup.error?.message ?? "")).replaceAll(password, "[redacted]"));
  assert.ok(!setup.stdout.includes(password) && !setup.stderr.includes(password));
  assert.notEqual(bootstrap("second-" + randomUUID() + "@example.invalid", password).status, 0, "Bootstrap cannot create a second administrator");
  const admin = (await db.query('SELECT u.id, c."passwordHash" FROM "User" u JOIN "AdminCredential" c ON c."userId"=u.id WHERE u.email=$1', [adminEmail])).rows[0];
  assert.notEqual(admin.passwordHash, password); assert.match(admin.passwordHash, /^scrypt\$/);
  const guestPage = await request("/admin");
  assert.equal(guestPage.status, 307); assert.equal(new URL(guestPage.headers.get("location")!, base).pathname, "/admin/login");
  assert.equal((await request("/api/admin/session")).status, 401);
  assert.equal((await request("/api/admin/not-a-route")).status, 401);
  assert.equal((await request("/admin/private-future-route")).status, 307);
  assert.equal((await fetch(base + "/admin", { redirect: "manual", headers: { RSC: "1" } })).status, 307);
  assert.equal((await request("/admin/login")).status, 200);

  const unknown = await request("/api/admin/auth/login", "POST", { email: "unknown-" + randomUUID() + "@example.invalid", password });
  const wrong = await request("/api/admin/auth/login", "POST", { email: adminEmail, password: password + "x" });
  assert.equal(unknown.status, 401); assert.equal(wrong.status, 401);
  assert.deepEqual(await unknown.json(), await wrong.json(), "No email enumeration in login errors");
  await db.query('INSERT INTO "AdminCredential" ("userId","passwordHash") VALUES ($1,$2)', [clientId, await hashPassword(password)]);
  const clientLogin = await request("/api/admin/auth/login", "POST", { email: clientEmail, password });
  assert.equal(clientLogin.status, 401, "Client role never grants admin access, even with a credential");
  assert.equal((await request("/api/admin/auth/login", "POST", { email: "admin-%@example.invalid", password })).status, 401);
  assert.equal((await request("/api/admin/auth/login", "POST", { email: adminEmail, password }, undefined, { Origin: "https://attacker.invalid" })).status, 403);
  assert.equal((await request("/api/admin/auth/login", "POST", { email: adminEmail, password, roles: ["ADMIN"] })).status, 400);
  const success = await request("/api/admin/auth/login", "POST", { email: adminEmail.toUpperCase(), password });
  assert.equal(success.status, 200);
  assert.deepEqual(await success.json(), { ok: true });
  const adminCookie = cookie(success), rawToken = adminCookie.split("=")[1];
  const session = (await db.query('SELECT id, "tokenHash" FROM "AdminSession" WHERE "userId"=$1', [admin.id])).rows[0];
  assert.equal(session.tokenHash.length, 64); assert.notEqual(session.tokenHash, rawToken);
  const who = await request("/api/admin/session", "GET", undefined, adminCookie);
  assert.equal(who.status, 200);
  assert.equal((await who.json()).user.role, "ADMIN");
  assert.match(who.headers.get("cache-control") ?? "", /no-store/);
  const adminPage = await request("/admin", "GET", undefined, adminCookie);
  assert.equal(adminPage.status, 200);
  assert.ok((await adminPage.text()).includes("Выйти"));
  console.log("PASS private pages/APIs, generic login failures, strong bootstrap, production cookie flags and hashed sessions");

  const operator = randomUUID();
  await db.query('INSERT INTO "User" (id,email,roles) VALUES ($1,$2,ARRAY[$3]::"Role"[])', [operator, operatorEmail, "OPERATOR"]);
  await db.query('INSERT INTO "AdminCredential" ("userId","passwordHash") VALUES ($1,$2)', [operator, await hashPassword(operatorPassword)]);
  const opResponse = await request("/api/admin/auth/login", "POST", { email: operatorEmail, password: operatorPassword });
  assert.equal(opResponse.status, 200);
  const opCookie = cookie(opResponse);
  const format = (await db.query('SELECT id FROM "SheetFormat" WHERE code=$1', ["A4"])).rows[0].id;
  const material = (await db.query('SELECT id FROM "Material" LIMIT 1')).rows[0].id;
  const profile = randomUUID(), list = randomUUID(), tariff = randomUUID();
  await db.query('INSERT INTO "ProductionProfile" (id,code,name,"sheetFormatId","workWidthMm","workHeightMm") VALUES ($1,$2,$2,$3,190,277)', [profile, "AUTH_TEST_PROFILE", format]);
  await db.query('INSERT INTO "PriceListVersion" (id,version,name,"validFrom") VALUES ($1,1,$2,now())', [list, "Auth test draft"]);
  await db.query('INSERT INTO "SheetTariff" (id,"priceListVersionId","materialId","productionProfileId","pricePerSheet") VALUES ($1,$2,$3,$4,18000)', [tariff,list,material,profile]);
  assert.equal((await request("/api/admin/tariffs/" + tariff, "PATCH", { pricePerSheet: "1.00" }, opCookie, { "X-User-Role": "ADMIN" })).status, 403);
  assert.equal((await db.query('SELECT "pricePerSheet"::text AS price FROM "SheetTariff" WHERE id=$1', [tariff])).rows[0].price, "18000.0000");
  assert.equal((await request("/api/admin/users/" + operator, "PATCH", { roles: ["ADMIN"], permissions: ["tariffs:write"] }, opCookie)).status, 404);
  assert.deepEqual((await db.query('SELECT roles::text[] AS roles,permissions FROM "User" WHERE id=$1', [operator])).rows[0], { roles: ["OPERATOR"], permissions: [] });
  assert.equal((await request("/api/admin/tariffs/" + tariff, "PATCH", { pricePerSheet: "1", roles: ["ADMIN"] }, adminCookie)).status, 400);
  await db.query('UPDATE "User" SET permissions=ARRAY[$1] WHERE id=$2', ["tariffs:write", operator]);
  const changed = await request("/api/admin/tariffs/" + tariff, "PATCH", { pricePerSheet: "19000.1250" }, opCookie);
  assert.equal(changed.status, 200); assert.equal((await changed.json()).pricePerSheet, "19000.1250");
  const priceAudit = (await db.query('SELECT before,after FROM "AuditLog" WHERE action=$1 AND "entityId"=$2', ["pricing.sheet_tariff_updated", tariff])).rows[0];
  assert.equal(priceAudit.before.pricePerSheet, "18000.0000");
  assert.equal(priceAudit.after.pricePerSheet, "19000.1250");
  await db.query('UPDATE "User" SET permissions=ARRAY[]::text[] WHERE id=$1', [operator]);
  assert.equal((await request("/api/admin/tariffs/" + tariff, "PATCH", { pricePerSheet: "1" }, opCookie)).status, 403);
  await db.query('UPDATE "User" SET roles=ARRAY[$1]::"Role"[] WHERE id=$2', ["CLIENT", operator]);
  assert.equal((await request("/api/admin/session", "GET", undefined, opCookie)).status, 401);
  await db.query('UPDATE "User" SET roles=ARRAY[$1]::"Role"[], "isActive"=false WHERE id=$2', ["OPERATOR", operator]);
  assert.equal((await request("/api/admin/session", "GET", undefined, opCookie)).status, 401);
  await db.query('UPDATE "User" SET "isActive"=true WHERE id=$1', [operator]);
  await db.query('UPDATE "AdminCredential" SET version=version+1 WHERE "userId"=$1', [operator]);
  assert.equal((await request("/api/admin/session", "GET", undefined, opCookie)).status, 401);
  console.log("PASS operator permission checks, no self-escalation/mass assignment and live role/permission/credential revalidation");

  const freshOp = await request("/api/admin/auth/login", "POST", { email: operatorEmail, password: operatorPassword });
  assert.equal(freshOp.status, 200);
  const expiring = cookie(freshOp);
  const expiringHash = createHash("sha256").update(expiring.split("=")[1]).digest("hex");
  const expired = await db.query('UPDATE "AdminSession" SET "createdAt"=$1, "expiresAt"=$2 WHERE "tokenHash"=$3 RETURNING id', ["1999-12-31T00:00:00Z", "2000-01-01T00:00:00Z", expiringHash]);
  assert.equal(expired.rowCount, 1);
  assert.equal((await request("/api/admin/session", "GET", undefined, expiring)).status, 401);

  const email = "rate-" + randomUUID() + "@example.invalid";
  const attempts = await Promise.all(Array.from({ length: 6 }, () => request("/api/admin/auth/login", "POST", { email, password })));
  assert.equal(attempts.filter((r) => r.status === 401).length, 5);
  assert.equal(attempts.filter((r) => r.status === 429).length, 1);
  assert.equal((await request("/api/admin/auth/logout", "GET", undefined, adminCookie)).status, 404);
  assert.equal((await request("/api/admin/auth/logout", "POST", undefined, adminCookie, { Origin: "https://attacker.invalid" })).status, 403);
  assert.equal((await request("/api/admin/session", "GET", undefined, adminCookie)).status, 200);
  const exit = await request("/api/admin/auth/logout", "POST", undefined, adminCookie);
  assert.equal(exit.status, 200); assert.match(exit.headers.getSetCookie().join(";"), /Max-Age=0/);
  assert.ok((await db.query('SELECT "revokedAt" FROM "AdminSession" WHERE id=$1', [session.id])).rows[0].revokedAt);
  assert.equal((await request("/api/admin/session", "GET", undefined, adminCookie)).status, 401);
  assert.equal((await request("/admin", "GET", undefined, adminCookie)).status, 307);
  const actions = (await db.query('SELECT action FROM "AuditLog"')).rows.map((r) => r.action);
  for (const action of ["auth.admin_bootstrap","auth.login_failed","auth.login_succeeded","auth.login_throttled","auth.permission_denied","auth.logout","pricing.sheet_tariff_updated"]) assert.ok(actions.includes(action), action);
  const logs = JSON.stringify((await db.query('SELECT * FROM "AuditLog"')).rows);
  for (const secret of [password, operatorPassword, rawToken, admin.passwordHash]) assert.ok(!logs.includes(secret), "No credentials in audit");
  console.log("PASS atomic login throttling, CSRF/logout POST, revoked-token replay rejection and redacted audit");
} finally { await db.end(); }
