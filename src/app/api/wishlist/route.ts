import { json, readJson, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { wishlistService } from "@/lib/services/wishlist.service";
import { parseInput } from "@/lib/validation/parse";
import { wishlistSchema } from "@/lib/validation/schemas";

export const dynamic = "force-dynamic";

/** GET /api/wishlist */
export const GET = route(async () => {
  return json({ items: await wishlistService.getWishlist(await getOwner()) });
});

/** POST /api/wishlist { productSlug }: 409 ALREADY_IN_WISHLIST if it's already saved. */
export const POST = route(async (request) => {
  const { productSlug } = parseInput(wishlistSchema, await readJson(request));
  const owner = await getOwner({ createIfMissing: true });
  await wishlistService.add(owner!, productSlug);
  return json({ productSlugs: await wishlistService.getProductSlugs(owner) }, { status: 201 });
});
