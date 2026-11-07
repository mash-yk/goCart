import { json, readJson, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { orderService } from "@/lib/services/order.service";
import { parseInput } from "@/lib/validation/parse";
import { checkoutSchema } from "@/lib/validation/schemas";
import { BadRequestError } from "@/lib/errors";

export const POST = route(async (request) => {
  const owner = await getOwner({ createIfMissing: true });
  if (!owner) {
    throw new BadRequestError("Unable to identify session. Please reload the page.");
  }

  const input = parseInput(checkoutSchema, await readJson(request));
  const origin = request.nextUrl.origin;

  const result = await orderService.createOrder(owner, input, origin);
  return json(result, { status: 201 });
});

