import { json, route } from "@/lib/api/handler";
import { catalogService } from "@/lib/services/catalog.service";

/** GET /api/search?q= returns a few lightweight suggestions for the header search box. */
export const GET = route(async (request) => {
  const q = (request.nextUrl.searchParams.get("q") ?? "").trim().slice(0, 100);
  if (q.length < 2) return json({ suggestions: [] });
  const products = await catalogService.suggest(q);
  return json({
    suggestions: products.map((p) => ({
      slug: p.slug,
      name: p.name,
      price: p.price,
      categorySlug: p.categorySlug,
      art: p.art,
    })),
  });
});
