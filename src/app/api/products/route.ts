import { json, readJson, route } from "@/lib/api/handler";
import { requireAdmin } from "@/lib/api/guards";
import { catalogService } from "@/lib/services/catalog.service";
import { parseInput } from "@/lib/validation/parse";
import { productInputSchema, productQuerySchema } from "@/lib/validation/schemas";

/**
 * GET /api/products?q=&category=&minPrice=&maxPrice=&minRating=&inStock=&onSale=&sort=&page=&pageSize=
 * Prices in the query string are whole dollars.
 */
export const GET = route(async (request) => {
  const query = parseInput(productQuerySchema, Object.fromEntries(request.nextUrl.searchParams));
  return json(await catalogService.searchProducts(query));
});

/** POST /api/products (admin only): creates a product. */
export const POST = route(async (request) => {
  await requireAdmin();
  const input = parseInput(productInputSchema, await readJson(request));
  const product = await catalogService.createProduct(input);
  return json({ product }, { status: 201 });
});
