import { createHash, randomBytes } from "node:crypto";
import { database } from "../database";
import { Prisma, type PrismaClient } from "../generated/prisma/client";
import { verifyPassword } from "./password";
import { SESSION_SECONDS } from "./config";

export type Actor = { id: string; email: string; displayName: string | null; role: "ADMIN" | "OPERATOR"; permissions: string[] };
export type Permission = "tariffs:write";
type Store = PrismaClient | Prisma.TransactionClient;
export class AuthError extends Error {
  constructor(public readonly status: number, public readonly code: string, message: string) { super(message); }
}
export const INVALID_LOGIN = "Неверный email или пароль.";
export const digestToken = (token: string) => createHash("sha256").update(token).digest("hex");
export function normalizeEmail(email: string): string { return email.trim().toLowerCase(); }
export function validEmail(email: string): boolean { return email.length <= 254 && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email); }
function staff(user: { id: string; email: string | null; displayName: string | null; isActive: boolean; roles: string[]; permissions: string[] }): Actor | null {
  if (!user.isActive || !user.email) return null;
  const role = user.roles.includes("ADMIN") ? "ADMIN" : user.roles.includes("OPERATOR") ? "OPERATOR" : null;
  return role ? { id: user.id, email: user.email, displayName: user.displayName, role, permissions: user.permissions } : null;
}
export function allowed(actor: Actor, permission: Permission): boolean { return actor.role === "ADMIN" || actor.permissions.includes(permission); }
export async function audit(action: string, actorId: string | null, detail: Prisma.InputJsonObject = {}, store: Store = database()) {
  await store.auditLog.create({ data: { action, actorId, entityType: "AdminAuthentication", after: detail } });
}
async function consumeAttempt(email: string): Promise<boolean> {
  const key = "email:" + digestToken(email);
  return database().$transaction(async (tx) => {
    const global = await tx.$queryRaw<Array<{ attempts: number }>>`
      INSERT INTO "LoginThrottle" (key, "windowStart", attempts)
      VALUES ('global', date_trunc('minute', now()), 1)
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN "LoginThrottle"."windowStart" = date_trunc('minute', now()) THEN "LoginThrottle".attempts + 1 ELSE 1 END,
        "windowStart" = date_trunc('minute', now())
      RETURNING attempts`;
    // A global bucket bounds password-spray/DB growth without trusting spoofable forwarding headers.
    if (global[0].attempts > 30) {
      await audit("auth.login_throttled", null, { bucket: "global" }, tx);
      return false;
    }
    const account = await tx.$queryRaw<Array<{ attempts: number }>>`
      INSERT INTO "LoginThrottle" (key, "windowStart", attempts)
      VALUES (${key}, date_bin('15 minutes', now(), '2000-01-01'::timestamptz), 1)
      ON CONFLICT (key) DO UPDATE SET
        attempts = CASE WHEN "LoginThrottle"."windowStart" = date_bin('15 minutes', now(), '2000-01-01'::timestamptz) THEN "LoginThrottle".attempts + 1 ELSE 1 END,
        "windowStart" = date_bin('15 minutes', now(), '2000-01-01'::timestamptz)
      RETURNING attempts`;
    if (account[0].attempts > 5) {
      await audit("auth.login_throttled", null, { bucket: "account", accountHash: key.slice(6) }, tx);
      return false;
    }
    return true;
  });
}
export async function login(emailValue: string, password: string) {
  const email = normalizeEmail(emailValue);
  if (!(await consumeAttempt(email))) throw new AuthError(429, "LOGIN_THROTTLED", "Слишком много попыток. Повторите позже.");
  const user = await database().user.findUnique({
    where: { email }, include: { adminCredential: true },
  });
  const matches = await verifyPassword(password, user?.adminCredential?.passwordHash);
  if (!matches || !user?.adminCredential || !staff(user)) {
    await audit("auth.login_failed", null, { accountHash: digestToken(email) });
    throw new AuthError(401, "INVALID_CREDENTIALS", INVALID_LOGIN);
  }
  const token = randomBytes(32).toString("base64url");
  const result = await database().$transaction(async (tx) => {
    const current = await tx.user.findUnique({ where: { id: user.id }, include: { adminCredential: true } });
    const actor = current && staff(current);
    if (!actor || !current.adminCredential || current.adminCredential.version !== user.adminCredential!.version) {
      await audit("auth.login_failed", null, { accountHash: digestToken(email) }, tx);
      return null;
    }
    const expiresAt = new Date(Date.now() + SESSION_SECONDS * 1000);
    const session = await tx.adminSession.create({ data: { userId: actor.id, tokenHash: digestToken(token), credentialVersion: current.adminCredential.version, expiresAt } });
    await audit("auth.login_succeeded", actor.id, { sessionId: session.id }, tx);
    return { actor, expiresAt };
  });
  if (!result) throw new AuthError(401, "INVALID_CREDENTIALS", INVALID_LOGIN);
  return { ...result, token };
}
export async function actorForSession(token: string | undefined, store?: Store): Promise<Actor | null> {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return null;
  const session = await (store ?? database()).adminSession.findUnique({
    where: { tokenHash: digestToken(token) },
    select: {
      userId: true, expiresAt: true, revokedAt: true, credentialVersion: true,
      user: { select: { id: true, email: true, displayName: true, roles: true, permissions: true, isActive: true, adminCredential: { select: { version: true } } } },
    },
  });
  if (!session || session.revokedAt || session.expiresAt <= new Date() ||
      session.user.adminCredential?.version !== session.credentialVersion) return null;
  return staff(session.user);
}
export async function requireActor(token: string | undefined, store?: Store): Promise<Actor> {
  const actor = await actorForSession(token, store);
  if (!actor) throw new AuthError(401, "UNAUTHENTICATED", "Требуется вход.");
  return actor;
}
export async function logout(token: string | undefined) {
  if (!token || !/^[A-Za-z0-9_-]{43}$/.test(token)) return;
  await database().$transaction(async (tx) => {
    const session = await tx.adminSession.findUnique({ where: { tokenHash: digestToken(token) } });
    if (!session) return;
    const changed = await tx.adminSession.updateMany({ where: { id: session.id, revokedAt: null }, data: { revokedAt: new Date() } });
    if (changed.count) await audit("auth.logout", session.userId, { sessionId: session.id }, tx);
  });
}
export async function updateSheetTariff(token: string | undefined, id: string, input: Record<string, unknown>) {
  const actor = await requireActor(token);
  if (!allowed(actor, "tariffs:write")) {
    await audit("auth.permission_denied", actor.id, { permission: "tariffs:write" });
    throw new AuthError(403, "FORBIDDEN", "Недостаточно прав.");
  }
  if (!/^[a-f0-9]{8}-(?:[a-f0-9]{4}-){3}[a-f0-9]{12}$/i.test(id) ||
      Object.keys(input).length !== 1 || typeof input.pricePerSheet !== "string" ||
      !/^(?:0|[1-9]\d{0,13})(?:\.\d{1,4})?$/.test(input.pricePerSheet)) {
    throw new AuthError(400, "INVALID_INPUT", "Передайте только корректную цену за лист строкой.");
  }
  return database().$transaction(async (tx) => {
    // Hold session/user rows against concurrent logout or role changes until the mutation commits.
    await tx.$queryRaw`SELECT id FROM "AdminSession" WHERE "tokenHash" = ${digestToken(token!)} FOR SHARE`;
    await tx.$queryRaw`SELECT id FROM "User" WHERE id = ${actor.id}::uuid FOR SHARE`;
    const current = await requireActor(token, tx);
    if (!allowed(current, "tariffs:write")) throw new AuthError(403, "FORBIDDEN", "Недостаточно прав.");
    const tariff = await tx.sheetTariff.findUnique({ where: { id }, include: { priceListVersion: { select: { status: true } } } });
    if (!tariff) throw new AuthError(404, "NOT_FOUND", "Тариф не найден.");
    if (tariff.priceListVersion.status !== "DRAFT") throw new AuthError(409, "PRICE_LIST_LOCKED", "Создайте новую черновую версию прайса.");
    const updated = await tx.sheetTariff.update({ where: { id }, data: { pricePerSheet: new Prisma.Decimal(input.pricePerSheet as string) } });
    await tx.auditLog.create({ data: { actorId: current.id, action: "pricing.sheet_tariff_updated", entityType: "SheetTariff", entityId: id, before: { pricePerSheet: tariff.pricePerSheet.toFixed(4) }, after: { pricePerSheet: updated.pricePerSheet.toFixed(4) } } });
    return { id: updated.id, pricePerSheet: updated.pricePerSheet.toFixed(4) };
  });
}
