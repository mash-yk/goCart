import { json, route } from "@/lib/api/handler";
import { getCurrentUser } from "@/lib/auth/session";

export const dynamic = "force-dynamic";

/** GET /api/auth/me: the signed-in user, or null. */
export const GET = route(async () => json({ user: await getCurrentUser() }));
