import { NextRequest, NextResponse } from "next/server";
import { actorForSession, sessionCookieName } from "@/server/auth";

function headers(response: NextResponse) {
  response.headers.set("Cache-Control", "private, no-store");
  response.headers.set("X-Robots-Tag", "noindex, nofollow");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.append("Vary", "Cookie");
  return response;
}
export async function proxy(request: NextRequest) {
  const path = request.nextUrl.pathname.replace(/\/+$/, "");
  const publicEntry = path === "/admin/login" ||
    path === "/api/admin/auth/login" || path === "/api/admin/auth/logout";
  if (publicEntry) return headers(NextResponse.next());
  try {
    const actor = await actorForSession(request.cookies.get(sessionCookieName())?.value);
    if (actor) return headers(NextResponse.next());
    if (path.startsWith("/api/")) return headers(NextResponse.json({ error: "UNAUTHENTICATED", message: "Требуется вход." }, { status: 401 }));
    return headers(NextResponse.redirect(new URL("/admin/login", request.url)));
  } catch {
    return headers(NextResponse.json({ error: "UNAVAILABLE", message: "Сервис временно недоступен." }, { status: 503 }));
  }
}
export const config = { matcher: ["/admin/:path*", "/api/admin/:path*"] };
