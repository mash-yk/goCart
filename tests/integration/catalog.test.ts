import { beforeAll, describe, expect, it } from "vitest";
import { products as seedProducts } from "@/data/catalog";
import { queryProducts } from "@/lib/business/catalog-query";
import { buildProductWhere, PRODUCT_ORDER_BY } from "@/lib/db/product-query";
import { productRepository } from "@/lib/db/repositories/product.repository";
import type { ProductQuery } from "@/types";
import { resetDatabase } from "./helpers";

const base: ProductQuery = { sort: "featured", page: 1, pageSize: 100 };

/** Runs a query in PostgreSQL the same way the catalog service does (without caching). */
async function inDatabase(query: ProductQuery) {
  const where = buildProductWhere(query);
  if (query.q && query.sort === "featured") return queryProducts(await productRepository.findMany(where), query).items;
  return productRepository.findMany(where, { orderBy: PRODUCT_ORDER_BY[query.sort], take: query.pageSize });
}

describe("catalog queries in PostgreSQL", () => {
  beforeAll(resetDatabase);

  // The database filters must return exactly what the in-memory reference implementation returns.
  it.each<Partial<ProductQuery>>([
    { category: "audio" },
    { minPrice: 5000, maxPrice: 15000 },
    { minRating: 4.6 },
    { inStock: true },
    { onSale: true },
    { q: "wireless" },
    { q: "desk lamp" },
    { q: "noise", category: "audio", onSale: true },
    { category: "fitness", sort: "price-asc" },
    { sort: "newest" },
    { sort: "rating" },
  ])("matches the reference results for %o", async (filters) => {
    const query = { ...base, ...filters };
    const expected = queryProducts(seedProducts, query).items.map((p) => p.slug);
    const actual = (await inDatabase(query)).map((p) => p.slug);
    if (query.sort === "featured" && !query.q) expect(new Set(actual)).toEqual(new Set(expected));
    else expect(actual).toEqual(expected);
  });

  it("returns nothing for a search with no match", async () => {
    expect(await inDatabase({ ...base, q: "toaster" })).toEqual([]);
  });

  it("counts products per category", async () => {
    const counts = await productRepository.countByCategory();
    expect(Object.values(counts).reduce((a, b) => a + b, 0)).toBe(seedProducts.length);
  });

  it("rejects a duplicate product slug with a 409", async () => {
    const product = seedProducts[0]!;
    await expect(productRepository.create(product)).rejects.toMatchObject({ status: 409, code: "PRODUCT_EXISTS" });
  });

  it("enforces price rules in the database itself", async () => {
    const product = { ...seedProducts[0]!, slug: "bad-sale-price", price: 5000, compareAtPrice: 4000 };
    await expect(productRepository.create(product)).rejects.toMatchObject({ status: 503 });
  });
});
