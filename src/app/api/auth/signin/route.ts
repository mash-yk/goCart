import { json, readJson, route } from "@/lib/api/handler";
import { authService } from "@/lib/services/auth.service";
import { parseInput } from "@/lib/validation/parse";
import { signInSchema } from "@/lib/validation/schemas";

/** POST /api/auth/signin { email, password } */
export const POST = route(async (request) => {
  const input = parseInput(signInSchema, await readJson(request));
  return json({ user: await authService.signIn(input) });
});
