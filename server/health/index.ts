import "server-only";
import { database } from "../database";
export async function readiness(): Promise<"ok" | "unavailable"> {
  try {
    const db = database();
    await db.product.findFirst({ select: { id: true } });
    await db.adminSession.findFirst({ select: { id: true } });
    return "ok";
  } catch { return "unavailable"; }
}
