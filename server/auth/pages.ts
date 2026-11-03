import "server-only";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { actorForSession, requireActor } from "./service";
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
