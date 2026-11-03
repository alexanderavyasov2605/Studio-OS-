import { NextRequest } from "next/server";
import { handleAdminRequest } from "@/server/auth/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
async function handle(request: NextRequest, context: Context) {
  return handleAdminRequest(request, (await context.params).segments);
}
export { handle as GET, handle as POST, handle as PATCH, handle as PUT, handle as DELETE };
