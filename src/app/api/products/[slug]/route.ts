import { json, readJson, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/api/guards";
import { catalogService } from "@/lib/services/catalog.service";
import { parseInput } from "@/lib/validation/parse";
import { productUpdateSchema, slugParamSchema } from "@/lib/validation/schemas";

type Params = { slug: string };

/** GET /api/products/:slug returns the product and related products. */
export const GET = route<Params>(async (_request, { params }) => {
  const slug = parseInput(slugParamSchema, (await params).slug);
  const product = await catalogService.getProduct(slug);
  const related = await catalogService.getRelatedProducts(product);
  return json({ product, related });
});

/** PATCH /api/products/:slug (admin only): updates price, stock and other fields. */
export const PATCH = route<Params>(async (request, { params }) => {
  await requireAdmin();
  const slug = parseInput(slugParamSchema, (await params).slug);
  const changes = parseInput(productUpdateSchema, await readJson(request));
  return json({ product: await catalogService.updateProduct(slug, changes) });
});

/** DELETE /api/products/:slug (admin only). */
export const DELETE = route<Params>(async (_request, { params }) => {
  await requireAdmin();
  const slug = parseInput(slugParamSchema, (await params).slug);
  await catalogService.deleteProduct(slug);
  return new Response(null, { status: 204 });
});
