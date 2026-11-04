import { json, readJson, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { NotFoundError } from "@/lib/errors";
import { cartService } from "@/lib/services/cart.service";
import { parseInput } from "@/lib/validation/parse";
import { slugParamSchema, updateCartItemSchema } from "@/lib/validation/schemas";

type Params = { slug: string };

/** PATCH /api/cart/:slug { quantity }: sets the quantity (0 removes the line). */
export const PATCH = route<Params>(async (request, { params }) => {
  const slug = parseInput(slugParamSchema, (await params).slug);
  const { quantity } = parseInput(updateCartItemSchema, await readJson(request));
  const owner = await getOwner();
  if (!owner) throw new NotFoundError("Cart item");
  return json({ cart: await cartService.updateQuantity(owner, slug, quantity) });
});

/** DELETE /api/cart/:slug: removes one line. */
export const DELETE = route<Params>(async (_request, { params }) => {
  const slug = parseInput(slugParamSchema, (await params).slug);
  const owner = await getOwner();
  if (!owner) throw new NotFoundError("Cart item");
  return json({ cart: await cartService.removeItem(owner, slug) });
});
