import type { Prisma } from "@/generated/prisma/client";
import { searchTerms } from "@/lib/business/catalog-query";
import type { ProductQuery, ProductSort } from "@/types";

/**
 * Turns the shop's filters into a Prisma `where` clause, so filtering runs in PostgreSQL.
 *
 * - Search: every word must appear in the product's normalised `search_text`.
 * - On sale: a CHECK constraint guarantees compare_at_price > price whenever it is set,
 *   so "on sale" is simply "has a compare-at price".
 */
export function buildProductWhere(query: Omit<ProductQuery, "sort" | "page" | "pageSize">): Prisma.ProductWhereInput {
  const and: Prisma.ProductWhereInput[] = [];

  if (query.category) and.push({ categorySlug: query.category });
  if (query.minPrice !== undefined || query.maxPrice !== undefined) {
    and.push({ price: { gte: query.minPrice, lte: query.maxPrice } });
  }
  if (query.minRating !== undefined) and.push({ rating: { gte: query.minRating } });
  if (query.inStock) and.push({ stock: { gt: 0 } });
  if (query.onSale) and.push({ compareAtPrice: { not: null } });
  for (const term of searchTerms(query.q)) and.push({ searchText: { contains: term } });

  return and.length > 0 ? { AND: and } : {};
}

/** SQL ordering for each sort option. The slug is a final tie-breaker so pages never overlap. */
export const PRODUCT_ORDER_BY: Record<ProductSort, Prisma.ProductOrderByWithRelationInput[]> = {
  featured: [{ featured: "desc" }, { rating: "desc" }, { slug: "asc" }],
  newest: [{ createdAt: "desc" }, { slug: "asc" }],
  "price-asc": [{ price: "asc" }, { slug: "asc" }],
  "price-desc": [{ price: "desc" }, { slug: "asc" }],
  rating: [{ rating: "desc" }, { reviewCount: "desc" }, { slug: "asc" }],
  name: [{ name: "asc" }, { slug: "asc" }],
};
