import { NextResponse, type NextRequest } from "next/server";
import { getConfig } from "@/lib/config";
import { maintenanceRepository } from "@/lib/db/repositories/maintenance.repository";

export const dynamic = "force-dynamic";

/**
 * Daily job (scheduled in vercel.json) that deletes guest carts and wishlists not
 * touched for 30 days. Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 */
export async function GET(request: NextRequest) {
  const { cronSecret } = getConfig();
  if (!cronSecret || request.headers.get("authorization") !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const deleted = await maintenanceRepository.deleteExpiredGuestData();
  return NextResponse.json({ ok: true, deleted });
}
