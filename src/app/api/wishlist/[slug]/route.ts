import { json, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { wishlistService } from "@/lib/services/wishlist.service";
import { parseInput } from "@/lib/validation/parse";
import { slugParamSchema } from "@/lib/validation/schemas";

type Params = { slug: string };

/** DELETE /api/wishlist/:slug */
export const DELETE = route<Params>(async (_request, { params }) => {
  const slug = parseInput(slugParamSchema, (await params).slug);
  const owner = await getOwner();
  if (owner) await wishlistService.remove(owner, slug);
  return json({ productSlugs: await wishlistService.getProductSlugs(owner) });
});
