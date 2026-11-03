import "server-only";
import { NextRequest, NextResponse } from "next/server";
import { authenticationOrigin, sessionCookieName, sessionCookieOptions } from "./config";
import { checkOrigin, privateJson } from "./http";
import { audit, AuthError, logout, userForSession } from "./service";
import { beginTelegramLogin, finishTelegramLogin, telegramCookieName } from "./telegram";
import { TelegramVerificationError } from "./telegram-token";

function redirect(path: string, status = 303) {
  const response = NextResponse.redirect(new URL(path, authenticationOrigin()), status);
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  return response;
}
export async function handleTelegramRequest(request: NextRequest, segments: string[]) {
  const path = segments.join("/");
  try {
    if (request.method === "POST") checkOrigin(request);
    if (path === "telegram/start" && request.method === "POST") {
      const attempt = await beginTelegramLogin();
      const response = request.headers.get("accept")?.includes("application/json") ? privateJson({ url: attempt.url }) : redirect(attempt.url);
      response.cookies.set(telegramCookieName(), attempt.browser, { ...sessionCookieOptions(), sameSite: "lax", maxAge: 300 });
      return response;
    }
    if (path === "telegram/callback" && request.method === "GET") {
      const query = request.nextUrl.searchParams;
      if (query.getAll("state").length !== 1 || query.getAll("code").length !== 1 || query.has("error")) throw new AuthError(401, "INVALID_TELEGRAM_LOGIN", "Вход не подтверждён.");
      const session = await finishTelegramLogin(query.get("state")!, request.cookies.get(telegramCookieName())?.value ?? "", query.get("code")!);
      // Rotate any old local session; Telegram tokens never reach the browser or database.
      await logout(request.cookies.get(sessionCookieName())?.value);
      const response = redirect(session.destination);
      response.cookies.set(sessionCookieName(), session.token, { ...sessionCookieOptions(), expires: session.expiresAt });
      response.cookies.set(telegramCookieName(), "", { ...sessionCookieOptions(), sameSite: "lax", maxAge: 0 });
      return response;
    }
    if (path === "logout" && request.method === "POST") {
      await logout(request.cookies.get(sessionCookieName())?.value);
      const response = redirect("/login");
      response.cookies.set(sessionCookieName(), "", { ...sessionCookieOptions(), maxAge: 0, expires: new Date(0) });
      return response;
    }
    if (path === "session" && request.method === "GET") {
      const user = await userForSession(request.cookies.get(sessionCookieName())?.value);
      return user ? privateJson({ user: { id: user.id, displayName: user.displayName } }) : privateJson({ error: "UNAUTHENTICATED" }, 401);
    }
    return privateJson({ error: "NOT_FOUND" }, 404);
  } catch (error) {
    if (path === "telegram/callback") {
      const reason = error instanceof TelegramVerificationError ? error.reason : error instanceof AuthError ? error.code :
        error instanceof Error && ["Telegram unavailable", "Invalid Telegram response", "Invalid signature", "Invalid key", "Invalid algorithm", "Invalid claims"].includes(error.message) ? error.message : "UNAVAILABLE";
      await audit("auth.telegram_login_failed", null, { reason }).catch(() => {});
      const response = redirect("/login?error=telegram");
      response.cookies.set(telegramCookieName(), "", { ...sessionCookieOptions(), sameSite: "lax", maxAge: 0 });
      return response;
    }
    const status = error instanceof AuthError ? error.status : 503;
    if (path === "telegram/start" && status !== 403 && !request.headers.get("accept")?.includes("application/json")) return redirect(status === 429 ? "/login?error=throttled" : "/login?error=unavailable");
    return privateJson({ error: error instanceof AuthError ? error.code : "UNAVAILABLE", message: "Не удалось выполнить запрос." }, status);
  }
}
