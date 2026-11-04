import { json, route } from "@/lib/api/handler";
import { catalogService } from "@/lib/services/catalog.service";

export const GET = route(async () => {
  const [categories, counts] = await Promise.all([
    catalogService.getCategories(),
    catalogService.getCategoryProductCounts(),
  ]);
  return json({ categories: categories.map((c) => ({ ...c, productCount: counts[c.slug] ?? 0 })) });
});
