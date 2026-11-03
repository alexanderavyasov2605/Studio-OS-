import { NextRequest } from "next/server";
import { handleTelegramRequest } from "@/server/auth/telegram-http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ segments: string[] }> };
async function handle(request: NextRequest, context: Context) {
  return handleTelegramRequest(request, (await context.params).segments);
}
export { handle as GET, handle as POST };
