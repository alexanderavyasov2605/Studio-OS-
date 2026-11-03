import { NextResponse } from "next/server";
import { readiness } from "@/server/health";
export const dynamic = "force-dynamic";
export const runtime = "nodejs";
export async function GET() {
  const status = await readiness();
  return NextResponse.json({ status }, { status: status === "ok" ? 200 : 503, headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff", "X-Robots-Tag": "noindex" } });
}
