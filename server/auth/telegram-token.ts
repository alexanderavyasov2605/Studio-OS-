import { createPublicKey, verify, type JsonWebKey } from "node:crypto";

export const TELEGRAM_ISSUER = "https://oauth.telegram.org";
export class TelegramVerificationError extends Error {
  constructor(public readonly reason: string) { super("Telegram verification failed"); }
}
type Key = JsonWebKey & { kid?: string; alg?: string; use?: string };
let cached: { keys: Key[]; until: number } | undefined;

export async function boundedJson(response: Response): Promise<Record<string, unknown>> {
  if (!response.ok || !response.body) throw new Error("Telegram unavailable");
  const reader = response.body.getReader();
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const item = await reader.read();
      if (item.done) break;
      size += item.value.length;
      if (size > 65536) { await reader.cancel(); throw new Error("Response too large"); }
      chunks.push(item.value);
    }
    const value: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("Invalid response");
    return value as Record<string, unknown>;
  } finally { reader.releaseLock(); }
}

async function publicKeys(): Promise<Key[]> {
  if (cached && cached.until > Date.now()) return cached.keys;
  const data = await boundedJson(await fetch(TELEGRAM_ISSUER + "/.well-known/jwks.json", { signal: AbortSignal.timeout(8000), redirect: "error" }));
  if (!Array.isArray(data.keys) || data.keys.length > 20) throw new Error("Invalid keys");
  const keys = data.keys as Key[];
  cached = { keys, until: Date.now() + 5 * 60_000 };
  return keys;
}

export function verifyTelegramToken(token: string, clientId: string, nonce: string, keys: Key[], now = Math.floor(Date.now() / 1000)) {
  if (token.length > 16384 || !/^[\w-]+\.[\w-]+\.[\w-]+$/.test(token)) throw new Error("Invalid token");
  const [headerPart, payloadPart, signature] = token.split(".");
  const header = JSON.parse(Buffer.from(headerPart, "base64url").toString("utf8"));
  if (header.alg !== "RS256" || typeof header.kid !== "string" || header.crit) throw new Error("Invalid algorithm");
  const matching = keys.filter(key => key.kid === header.kid && key.kty === "RSA" && (!key.alg || key.alg === "RS256") && (!key.use || key.use === "sig"));
  if (matching.length !== 1) throw new Error("Invalid key");
  const key = matching[0];
  const publicKey = createPublicKey({ format: "jwk", key: { kty: "RSA", n: key.n, e: key.e } });
  if (!verify("RSA-SHA256", Buffer.from(headerPart + "." + payloadPart), publicKey, Buffer.from(signature, "base64url"))) throw new Error("Invalid signature");
  const claims = JSON.parse(Buffer.from(payloadPart, "base64url").toString("utf8"));
  if (claims.iss !== TELEGRAM_ISSUER) throw new TelegramVerificationError("issuer");
  if (claims.aud !== clientId) throw new TelegramVerificationError("audience");
  if (claims.nonce !== nonce) throw new TelegramVerificationError(claims.nonce === undefined ? "nonce_missing" : "nonce_mismatch");
  if (claims.id === undefined) throw new TelegramVerificationError("id_missing");
  if (typeof claims.id !== "number") throw new TelegramVerificationError("id_type");
  if (
      typeof claims.exp !== "number" || claims.exp <= now || typeof claims.iat !== "number" || claims.iat > now + 30 || claims.iat < now - 600 || claims.exp <= claims.iat ||
      (claims.nbf !== undefined && (typeof claims.nbf !== "number" || claims.nbf > now + 30)) ||
      typeof claims.sub !== "string" || !claims.sub || !Number.isSafeInteger(claims.id) || claims.id <= 0) throw new Error("Invalid claims");
  return { id: String(claims.id), name: typeof claims.name === "string" ? claims.name.slice(0, 200) : "Пользователь Telegram", username: typeof claims.preferred_username === "string" && /^[a-zA-Z0-9_]{1,64}$/.test(claims.preferred_username) ? claims.preferred_username : null };
}

export async function verifiedTelegramIdentity(token: string, clientId: string, nonce: string) {
  return verifyTelegramToken(token, clientId, nonce, await publicKeys());
}
