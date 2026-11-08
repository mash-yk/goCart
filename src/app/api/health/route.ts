import { json, route } from "@/lib/api/handler";
import { maintenanceRepository } from "@/lib/db/repositories/maintenance.repository";

export const dynamic = "force-dynamic";

/** Health check for uptime monitors: reports whether PostgreSQL is reachable. */
export const GET = route(async () => {
  const started = Date.now();
  try {
    await maintenanceRepository.ping();
    return json({ status: "ok", database: "connected", latencyMs: Date.now() - started });
  } catch (error) {
    console.error("[health] database check failed", error);
    return json({ status: "degraded", database: "unreachable" }, { status: 503 });
  }
});
