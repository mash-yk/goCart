import { json, readJson, route } from "@/lib/api/handler";
import { requireUser } from "@/lib/auth/session";
import { userService } from "@/lib/services/user.service";
import { parseInput } from "@/lib/validation/parse";
import { updateProfileSchema } from "@/lib/validation/schemas";

/** PATCH /api/account { name }: updates the signed-in user's profile. */
export const PATCH = route(async (request) => {
  const user = await requireUser();
  const { name } = parseInput(updateProfileSchema, await readJson(request));
  return json({ user: await userService.updateProfile(user.id, name) });
});

/** DELETE /api/account: deletes the account, cart and wishlist. */
export const DELETE = route(async () => {
  const user = await requireUser();
  await userService.deleteAccount(user.id);
  return new Response(null, { status: 204 });
});
