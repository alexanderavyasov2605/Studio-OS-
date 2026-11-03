import { afterEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";

vi.mock("server-only", () => ({}));
vi.mock("../server/auth/telegram", () => ({
  telegramCookieName: () => "__Host-studio_telegram",
  beginTelegramLogin: vi.fn(), finishTelegramLogin: vi.fn(),
}));
vi.mock("../server/auth/service", async importOriginal => ({
  ...await importOriginal<typeof import("../server/auth/service")>(),
  logout: vi.fn(), audit: vi.fn(),
}));
import { finishTelegramLogin } from "../server/auth/telegram";
import { handleTelegramRequest } from "../server/auth/telegram-http";

afterEach(() => { vi.unstubAllEnvs(); vi.clearAllMocks(); });
describe("Telegram callback browser transition", () => {
  it("ends the cross-site redirect chain before navigating with a Strict session cookie", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("APP_ORIGIN", "https://studio.example.invalid");
    vi.mocked(finishTelegramLogin).mockResolvedValue({ destination: "/admin", token: "a".repeat(43), expiresAt: new Date(Date.now() + 3600000) });
    const request = new NextRequest("https://studio.example.invalid/api/auth/telegram/callback?state=fixture&code=fixture", { headers: { Cookie: "__Host-studio_telegram=fixture" } });
    const response = await handleTelegramRequest(request, ["telegram", "callback"]);
    expect(response.status).toBe(200); expect(response.headers.get("location")).toBeNull();
    expect(response.headers.get("cache-control")).toBe("private, no-store");
    expect(response.headers.get("content-type")).toContain("text/html");
    const cookie = response.headers.getSetCookie().find(value => value.startsWith("__Host-studio_admin="));
    expect(cookie).toMatch(/HttpOnly/i); expect(cookie).toMatch(/Secure/i); expect(cookie).toMatch(/SameSite=Strict/i); expect(cookie).not.toMatch(/Domain=/i);
    const html = await response.text();
    expect(html).toContain('window.location.replace("/admin")'); expect(html).toContain('href="/admin"');
    const nonce = html.match(/<script nonce="([\w-]+)"/)?.[1]; expect(nonce).toBeTruthy();
    expect(response.headers.get("content-security-policy")).toContain(`script-src 'nonce-${nonce}'`);
    expect(response.headers.get("content-security-policy")).toContain("frame-ancestors 'none'");
    expect(html).not.toContain("a".repeat(43));
  });
  it("never renders an external redirect or injected script destination", async () => {
    vi.stubEnv("NODE_ENV", "production"); vi.stubEnv("APP_ORIGIN", "https://studio.example.invalid");
    vi.mocked(finishTelegramLogin).mockResolvedValue({ destination: 'https://evil.invalid/</script>', token: "a".repeat(43), expiresAt: new Date(Date.now() + 3600000) });
    const response = await handleTelegramRequest(new NextRequest("https://studio.example.invalid/api/auth/telegram/callback?state=fixture&code=fixture"), ["telegram", "callback"]);
    const html = await response.text(); expect(html).not.toContain("evil.invalid"); expect(html).toContain('window.location.replace("/account")');
  });
});
