export const SESSION_SECONDS = 8 * 60 * 60;
export function sessionCookieName(): string {
  return process.env.NODE_ENV === "production" ? "__Host-studio_admin" : "studio_admin";
}
export function authenticationOrigin(): URL {
  const value = process.env.APP_ORIGIN ?? (process.env.NODE_ENV !== "production" ? "http://localhost:3000" : "");
  if (!value) throw new Error("APP_ORIGIN is required");
  const url = new URL(value);
  if (url.username || url.password || url.search || url.hash || url.pathname !== "/") throw new Error("APP_ORIGIN must be an origin");
  const local = ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  if (url.protocol !== "https:" && !(process.env.NODE_ENV !== "production" && local && url.protocol === "http:")) {
    throw new Error("HTTPS is required outside local development");
  }
  return url;
}
export function sessionCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production" || authenticationOrigin().protocol === "https:",
    sameSite: "strict" as const,
    path: "/",
    maxAge: SESSION_SECONDS,
  };
}
