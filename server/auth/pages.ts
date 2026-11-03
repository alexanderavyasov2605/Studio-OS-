import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorForSession, requireActor, userForSession } from "./service";
import { telegramConfiguration } from "./telegram";
import { sessionCookieName } from "./config";

export async function requireAdminPage() {
  const token = (await cookies()).get(sessionCookieName())?.value;
  const actor = await actorForSession(token);
  if (!actor) redirect("/admin/login");
  return requireActor(token);
}
export async function currentAdmin() {
  return actorForSession((await cookies()).get(sessionCookieName())?.value);
}
export function telegramLoginAvailable() { return telegramConfiguration() !== null; }
export async function currentAccount() {
  const user = await userForSession((await cookies()).get(sessionCookieName())?.value);
  return user ? { displayName: user.displayName, isStaff: user.roles.includes("ADMIN") || user.roles.includes("OPERATOR") } : null;
}
