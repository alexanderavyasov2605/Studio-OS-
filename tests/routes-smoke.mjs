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
  ["/admin", "Администрирование"],
];

for (const [path, heading] of routes) {
  const response = await fetch(new URL(path, baseUrl));
  assert.equal(response.status, 200, path);
  const html = await response.text();
  assert.match(html, /<html lang="ru"/, path);
  assert.ok(html.includes(heading), path);
  assert.ok(html.includes("Страница-заглушка"), path);
  assert.equal(html.includes('aria-label="Основная навигация"'), path !== "/admin", path);
  assert.equal(html.includes('aria-label="Административная навигация"'), path === "/admin", path);
  console.log(`PASS ${path}: HTTP 200, page content and layout`);
}
