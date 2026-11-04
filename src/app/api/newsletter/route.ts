import { json, readJson, route } from "@/lib/api/handler";
import { newsletterService } from "@/lib/services/newsletter.service";
import { parseInput } from "@/lib/validation/parse";
import { newsletterSchema } from "@/lib/validation/schemas";

/** POST /api/newsletter { email } */
export const POST = route(async (request) => {
  const { email } = parseInput(newsletterSchema, await readJson(request));
  const result = await newsletterService.subscribe(email);
  return json(result, { status: result.alreadySubscribed ? 200 : 201 });
});
