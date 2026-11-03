import { generateKeyPairSync, sign } from "node:crypto";
import { describe, expect, it } from "vitest";
import { verifyTelegramToken, TELEGRAM_ISSUER } from "../server/auth/telegram-token";

const { privateKey, publicKey } = generateKeyPairSync("rsa", { modulusLength: 2048 });
const key = { ...publicKey.export({ format: "jwk" }), kid: "fixture", alg: "RS256" };
const now = 1800000000;
const claims = { iss: TELEGRAM_ISSUER, aud: "123456", sub: "opaque-subject", id: 930826522, nonce: "fixture-nonce", iat: now, exp: now + 300, name: "Fixture" };
function token(overrides = {}, header = {}) {
  const parts = [JSON.stringify({ alg: "RS256", kid: "fixture", ...header }), JSON.stringify({ ...claims, ...overrides })].map(value => Buffer.from(value).toString("base64url"));
  return parts.join(".") + "." + sign("RSA-SHA256", Buffer.from(parts.join(".")), privateKey).toString("base64url");
}
describe("Telegram identity verification", () => {
  it("accepts only a signed Telegram numeric ID, independently of display name", () => {
    expect(verifyTelegramToken(token(), "123456", "fixture-nonce", [key], now).id).toBe("930826522");
    expect(verifyTelegramToken(token({ id: 42, name: "930826522" }), "123456", "fixture-nonce", [key], now).id).toBe("42");
  });
  it("rejects forged signatures, algorithms, unknown keys and malformed tokens", () => {
    const forged = token().split(".");
    forged[1] = Buffer.from(JSON.stringify({ ...claims, id: 1 })).toString("base64url");
    for (const value of [forged.join("."), token({}, { alg: "none" }), token({}, { kid: "unknown" }), "bad", "x".repeat(17000)]) {
      expect(() => verifyTelegramToken(value, "123456", "fixture-nonce", [key], now)).toThrow();
    }
  });
  it("rejects wrong issuer, audience, nonce, old/future/expired claims and unsafe IDs", () => {
    for (const override of [{ iss: "https://evil.invalid" }, { aud: "wrong" }, { nonce: "other-browser" }, { exp: now }, { iat: now - 601 }, { iat: now + 31 }, { nbf: now + 100 }, { id: "930826522" }, { id: -1 }, { id: Number.MAX_SAFE_INTEGER + 1 }, { sub: "" }]) {
      expect(() => verifyTelegramToken(token(override), "123456", "fixture-nonce", [key], now)).toThrow();
    }
  });
});
