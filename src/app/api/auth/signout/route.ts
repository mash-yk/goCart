import { json, route } from "@/lib/api/handler";
import { authService } from "@/lib/services/auth.service";

/** POST /api/auth/signout */
export const POST = route(async () => {
  await authService.signOut();
  return json({ ok: true });
});
