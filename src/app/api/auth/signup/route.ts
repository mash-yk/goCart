import { json, readJson, route } from "@/lib/api/handler";
import { authService } from "@/lib/services/auth.service";
import { parseInput } from "@/lib/validation/parse";
import { signUpSchema } from "@/lib/validation/schemas";

/** POST /api/auth/signup { name, email, password } */
export const POST = route(async (request) => {
  const input = parseInput(signUpSchema, await readJson(request));
  const user = await authService.signUp(input);
  return json({ user }, { status: 201 });
});
