import { randomBytes } from "node:crypto";
import { database } from "../database";
import { authenticationOrigin, SESSION_SECONDS } from "./config";
import { AuthError, audit, consumeAttempt, digestToken } from "./service";
import { boundedJson, TELEGRAM_ISSUER, verifiedTelegramIdentity } from "./telegram-token";

const opaque = () => randomBytes(32).toString("base64url");
export const telegramCookieName = () => process.env.NODE_ENV === "production" ? "__Host-studio_telegram" : "studio_telegram";
export function telegramConfiguration() {
  const clientId = process.env.TELEGRAM_CLIENT_ID;
  const secret = process.env.TELEGRAM_CLIENT_SECRET;
  const adminId = process.env.TELEGRAM_ADMIN_ID;
  if (!clientId || !/^\d{1,20}$/.test(clientId) || !secret || secret.length < 16 || !adminId || !/^[1-9]\d{0,15}$/.test(adminId)) return null;
  return { clientId, secret, adminId, callback: new URL("/api/auth/telegram/callback", authenticationOrigin()).href };
}
export async function beginTelegramLogin() {
  const config = telegramConfiguration();
  if (!config) throw new AuthError(503, "NOT_CONFIGURED", "Вход через Telegram пока не настроен.");
  if (!await consumeAttempt("telegram:begin", true)) throw new AuthError(429, "LOGIN_THROTTLED", "Слишком много попыток. Повторите позже.");
  const state = opaque(), browser = opaque(), verifier = opaque(), nonce = opaque();
  await database().$transaction(async tx => {
    // Use the same database clock when creating, expiring and consuming challenges.
    await tx.$executeRaw`DELETE FROM "TelegramLoginAttempt" WHERE "expiresAt" < now()`;
    await tx.$executeRaw`INSERT INTO "TelegramLoginAttempt" ("stateHash", "browserHash", verifier, nonce, "expiresAt")
      VALUES (${digestToken(state)}, ${digestToken(browser)}, ${verifier}, ${nonce}, now() + interval '5 minutes')`;
  });
  const url = new URL(TELEGRAM_ISSUER + "/auth");
  for (const [key, value] of Object.entries({ client_id: config.clientId, redirect_uri: config.callback, response_type: "code", scope: "openid profile", state, nonce, code_challenge: Buffer.from(digestToken(verifier), "hex").toString("base64url"), code_challenge_method: "S256" })) url.searchParams.set(key, value);
  return { url: url.href, browser };
}

export async function finishTelegramLogin(state: string, browser: string, code: string) {
  const config = telegramConfiguration();
  if (!config || !/^[\w-]{43}$/.test(state) || !/^[\w-]{43}$/.test(browser) || !code || code.length > 4096) throw new AuthError(401, "INVALID_TELEGRAM_LOGIN", "Не удалось подтвердить вход.");
  // DELETE RETURNING consumes the challenge exactly once, including concurrent callbacks.
  const attempts = await database().$queryRaw<Array<{ verifier: string; nonce: string }>>`
    DELETE FROM "TelegramLoginAttempt" WHERE "stateHash" = ${digestToken(state)} AND "browserHash" = ${digestToken(browser)} AND "expiresAt" > now() RETURNING verifier, nonce`;
  const attempt = attempts[0];
  if (!attempt) throw new AuthError(401, "INVALID_TELEGRAM_LOGIN", "Не удалось подтвердить вход.");
  const response = await fetch(TELEGRAM_ISSUER + "/token", {
    method: "POST", redirect: "error", signal: AbortSignal.timeout(8000),
    headers: { "Content-Type": "application/x-www-form-urlencoded", Authorization: "Basic " + Buffer.from(config.clientId + ":" + config.secret).toString("base64") },
    body: new URLSearchParams({ grant_type: "authorization_code", code, redirect_uri: config.callback, client_id: config.clientId, code_verifier: attempt.verifier }),
  });
  const tokens = await boundedJson(response);
  if (typeof tokens.id_token !== "string") throw new Error("Invalid Telegram response");
  const identity = await verifiedTelegramIdentity(tokens.id_token, config.clientId, attempt.nonce);
  const token = opaque();
  const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
  const result = await database().$transaction(async tx => {
    // Serialize first logins for an identity; never link accounts by email or username.
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${BigInt(identity.id)})::text`;
    const linked = await tx.telegramIdentity.findUnique({ where: { telegramUserId: BigInt(identity.id) }, include: { user: true } });
    const owner = identity.id === config.adminId;
    let user = linked?.user;
    if (user && !user.isActive) throw new AuthError(403, "ACCOUNT_DISABLED", "Вход недоступен.");
    if (!user) {
      user = await tx.user.create({ data: { displayName: identity.name, roles: [owner ? "ADMIN" : "CLIENT"], telegramIdentity: { create: { telegramUserId: BigInt(identity.id), username: identity.username } } } });
      await audit(owner ? "auth.telegram_admin_created" : "auth.telegram_user_created", user.id, {}, tx);
    } else if (owner && !user.roles.includes("ADMIN")) {
      user = await tx.user.update({ where: { id: user.id }, data: { roles: { push: "ADMIN" } } });
      await audit("auth.telegram_owner_granted", user.id, {}, tx);
    }
    // Non-owner Telegram identities cannot acquire administrator rights through this flow.
    if (!owner && user.roles.includes("ADMIN")) throw new AuthError(403, "FORBIDDEN", "Вход недоступен.");
    const session = await tx.adminSession.create({ data: { userId: user.id, tokenHash: digestToken(token), credentialVersion: 0, authProvider: "TELEGRAM", expiresAt } });
    await audit("auth.telegram_login_succeeded", user.id, { sessionId: session.id }, tx);
    return { destination: user.roles.includes("ADMIN") || user.roles.includes("OPERATOR") ? "/admin" : "/account" };
  });
  return { ...result, token, expiresAt };
}
