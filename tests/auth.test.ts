import { randomBytes } from "node:crypto";
import { describe, expect, it } from "vitest";
import { hashPassword, validNewPassword, verifyPassword } from "../server/auth/password";
import { allowed, type Actor } from "../server/auth/service";

describe("admin authentication primitives", () => {
  it("uses independent salts, verifies passwords and rejects invalid/unknown hashes", async () => {
    const password = randomBytes(24).toString("base64url");
    const first = await hashPassword(password), second = await hashPassword(password);
    expect(first).not.toBe(second);
    expect(first).not.toContain(password);
    expect(await verifyPassword(password, first)).toBe(true);
    expect(await verifyPassword(password + "x", first)).toBe(false);
    expect(await verifyPassword(password, null)).toBe(false);
    expect(await verifyPassword(password, first.replace("131072", "999999999"))).toBe(false);
  }, 15000);
  it("requires a strong bounded bootstrap password", () => {
    expect(validNewPassword("short")).toBe(false);
    expect(validNewPassword("x".repeat(257))).toBe(false);
    expect(validNewPassword(randomBytes(24).toString("base64url"))).toBe(true);
  });
  it("requires explicit operator permission", () => {
    const operator: Actor = { id: "fixture", email: "fixture@example.invalid", displayName: null, role: "OPERATOR", permissions: [] };
    expect(allowed(operator, "tariffs:write")).toBe(false);
    expect(allowed({ ...operator, permissions: ["tariffs:write"] }, "tariffs:write")).toBe(true);
    expect(allowed({ ...operator, role: "ADMIN" }, "tariffs:write")).toBe(true);
  });
});
