import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { authenticationOrigin, sessionCookieName, sessionCookieOptions } from "./config";
import { AuthError, allowed, audit, login, logout, requireActor, updateSheetTariff, validEmail } from "./service";
import { adminCatalog, saveProduct } from "../catalog/service";

export function privateJson(body: unknown, status = 200) {
  return NextResponse.json(body, { status, headers: {
    "Cache-Control": "private, no-store", "Vary": "Cookie",
    "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex, nofollow",
  } });
}
export function checkOrigin(request: Request) {
  const site = request.headers.get("sec-fetch-site");
  if (request.headers.get("origin") !== authenticationOrigin().origin || (site && site !== "same-origin" && site !== "none")) {
    throw new AuthError(403, "INVALID_ORIGIN", "Запрос отклонён.");
  }
}
async function readObject(request: Request, limit = 4096): Promise<Record<string, unknown>> {
  if (request.headers.get("content-type")?.split(";")[0].trim().toLowerCase() !== "application/json") throw new AuthError(400, "INVALID_INPUT", "Некорректный запрос.");
  const reader = request.body?.getReader();
  if (!reader) throw new AuthError(400, "INVALID_INPUT", "Некорректный запрос.");
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const next = await reader.read();
      if (next.done) break;
      size += next.value.length;
      if (size > limit) {
        await reader.cancel();
        throw new AuthError(413, "BODY_TOO_LARGE", "Запрос слишком большой.");
      }
      chunks.push(next.value);
    }
    const body: unknown = JSON.parse(Buffer.concat(chunks).toString("utf8"));
    if (!body || typeof body !== "object" || Array.isArray(body)) throw new Error("Invalid object");
    return body as Record<string, unknown>;
  } catch (error) {
    if (error instanceof AuthError) throw error;
    throw new AuthError(400, "INVALID_INPUT", "Некорректный запрос.");
  } finally { reader.releaseLock(); }
}
export async function handleAdminRequest(request: NextRequest, segments: string[]) {
  const path = segments.join("/");
  const token = request.cookies.get(sessionCookieName())?.value;
  try {
    if (request.method !== "GET") checkOrigin(request);
    if (path === "auth/login" && request.method === "POST") {
      const body = await readObject(request);
      if (Object.keys(body).length !== 2 || typeof body.email !== "string" || !validEmail(body.email.trim()) ||
          typeof body.password !== "string" || Buffer.byteLength(body.password, "utf8") > 256 || !body.password) {
        throw new AuthError(400, "INVALID_INPUT", "Некорректный запрос.");
      }
      const session = await login(body.email, body.password);
      const response = privateJson({ ok: true });
      response.cookies.set(sessionCookieName(), session.token, { ...sessionCookieOptions(), expires: session.expiresAt });
      return response;
    }
    if (path === "auth/logout" && request.method === "POST") {
      await logout(token);
      const response = privateJson({ ok: true });
      response.cookies.set(sessionCookieName(), "", { ...sessionCookieOptions(), maxAge: 0, expires: new Date(0) });
      return response;
    }
    const actor = await requireActor(token);
    if (path === "catalog" && request.method === "GET") return privateJson({ ...(await adminCatalog()), canWrite: allowed(actor, "catalog:write") });
    if (path === "catalog/products" && request.method === "POST") return privateJson(await saveProduct(token, null, await readObject(request, 32768)), 201);
    if (segments.length === 3 && segments[0] === "catalog" && segments[1] === "products" && request.method === "PUT") return privateJson(await saveProduct(token, segments[2], await readObject(request, 32768)));
    if (path === "session" && request.method === "GET") return privateJson({ user: actor });
    if (segments.length === 2 && segments[0] === "tariffs" && request.method === "PATCH") {
      return privateJson(await updateSheetTariff(token, segments[1], await readObject(request)));
    }
    if (request.method !== "GET") await audit("auth.unsupported_mutation_denied", actor.id, { method: request.method });
    return privateJson({ error: "NOT_FOUND", message: "Метод недоступен." }, 404);
  } catch (error) {
    if (error instanceof AuthError) {
      const response = privateJson({ error: error.code, message: error.message }, error.status);
      if (error.status === 429) response.headers.set("Retry-After", "900");
      return response;
    }
    // Never serialize database errors, credentials or connection settings.
    return privateJson({ error: "UNAVAILABLE", message: "Сервис временно недоступен." }, 503);
  }
}
