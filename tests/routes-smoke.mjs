import assert from "node:assert/strict";

// Run after pnpm dev/start. Optional first argument selects another local port.
const baseUrl = process.argv[2] ?? "http://127.0.0.1:3000";
const routes = [
  ["/", "Studio OS"],
  ["/catalog", "Каталог"],
  ["/configure/a4", "Конфигуратор"],
  ["/configure/arbitrary-slug", "Конфигуратор"],
  ["/cart", "Корзина"],
  ["/orders", "Мои заказы"],
  ["/mini", "Telegram Mini App"],
];

for (const [path, status] of [["/login", 200], ["/account", 307], ["/api/auth/session", 401], ["/api/auth/telegram/start", 404], ["/api/auth/telegram/callback?state=invalid&code=invalid", 303]]) {
  const response = await fetch(new URL(path, baseUrl), { redirect: "manual" });
  assert.equal(response.status, status, path);
}
for (const path of ["/api/auth/logout", "/api/auth/telegram/start"]) {
  const response = await fetch(new URL(path, baseUrl), { method: "POST", redirect: "manual", headers: { Origin: "https://invalid.example" } });
  assert.equal(response.status, 403, path + " rejects foreign origin");
}
console.log("PASS Telegram auth HTTP: public login, guest restrictions, callback failure and CSRF");

for (const [path, heading] of routes) {
  const response = await fetch(new URL(path, baseUrl));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.match(html, /<html lang="ru"/, path);
  assert.ok(html.includes(heading), path);
  if (path !== "/catalog") assert.ok(html.includes("Страница-заглушка"), path);
  assert.equal(html.includes('aria-label="Основная навигация"'), path !== "/admin" && path !== "/mini", path);
  assert.equal(html.includes('aria-label="Административная навигация"'), path === "/admin", path);
  assert.equal(html.includes('aria-label="Навигация Mini App"'), path === "/mini", path);
  console.log(`PASS ${path}: HTTP 200, page content and layout`);
}

const admin = await fetch(new URL("/admin", baseUrl), { redirect: "manual" });
assert.equal(admin.status, 307, (await admin.text()).slice(0, 2000));
assert.equal(new URL(admin.headers.get("location"), baseUrl).pathname, "/admin/login");
const login = await fetch(new URL("/admin/login", baseUrl));
assert.equal(login.status, 200);
assert.ok((await login.text()).includes("Вход для сотрудников"));
assert.equal((await fetch(new URL("/api/admin/session", baseUrl))).status, 401);
console.log("PASS guest admin redirect, public staff login and protected service API");

const uiKit = await fetch(new URL("/ui-kit", baseUrl));
const health = await fetch(new URL("/api/health", baseUrl));
assert.equal(health.status, 200, "Migrated database is ready");
assert.deepEqual(await health.json(), { status: "ok" });
assert.equal(health.headers.get("cache-control"), "no-store");
console.log("PASS readiness: catalog/session tables accessible, no details exposed");
const isDev = baseUrl.endsWith(":3100");
assert.equal(uiKit.status, isDev ? 200 : 404, "UI kit is development-only");
const kitHtml = await uiKit.text();
assert.equal(kitHtml.includes("Справочник визуальных статусов"), isDev);
console.log(`PASS /ui-kit: ${isDev ? "available in dev" : "404 in production"}`);
