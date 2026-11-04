import { json, readJson, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { cartService } from "@/lib/services/cart.service";
import { parseInput } from "@/lib/validation/parse";
import { addToCartSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/** GET /api/cart: the current cart with live prices and totals. */
export const GET = route(async () => {
  return json({ cart: await cartService.getCart(await getOwner()) });
});

/** POST /api/cart { productSlug, quantity }: adds to the cart (combines with an existing line). */
export const POST = route(async (request) => {
  const { productSlug, quantity } = parseInput(addToCartSchema, await readJson(request));
  const owner = await getOwner({ createIfMissing: true });
  const cart = await cartService.addItem(owner!, productSlug, quantity);
  return json({ cart }, { status: 201 });
});

/** DELETE /api/cart: empties the cart. */
export const DELETE = route(async () => {
  const owner = await getOwner();
  if (owner) await cartService.clear(owner);
  return json({ cart: await cartService.getCart(owner) });
});
