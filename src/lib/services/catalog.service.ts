import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { categoryRepository } from "@/lib/db/repositories/category.repository";
import { productRepository } from "@/lib/db/repositories/product.repository";
import { buildProductWhere, PRODUCT_ORDER_BY } from "@/lib/db/product-query";
import { findRelatedProducts, paginate, queryProducts } from "@/lib/business/catalog-query";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { ProductInput, ProductUpdateInput } from "@/lib/validation/schemas";
import type { ArtIcon, Category, Paginated, Product, ProductQuery } from "@/types";

const CATALOG_TAG = "catalog";
const CATALOG_TTL_SECONDS = 300;

/**
 * Catalog reads are cached for five minutes (per set of arguments) and tagged "catalog".
 * Every admin write calls revalidateTag("catalog"), so changes show up immediately.
 * Carts, wishlists and orders are never cached.
 */
function cached<A extends unknown[], R>(key: string, fn: (...args: A) => Promise<R>) {
  return unstable_cache(fn, [`catalog:${key}`], { tags: [CATALOG_TAG], revalidate: CATALOG_TTL_SECONDS });
}

const getCategoriesCached = cached("categories", () => categoryRepository.list());
const getCountsCached = cached("counts", () => productRepository.countByCategory());
const getProductCached = cached("product", (slug: string) => productRepository.getBySlug(slug));

const searchCached = cached("search", async (query: ProductQuery): Promise<Paginated<Product>> => {
  const where = buildProductWhere(query);

  // Text searches with the default sort are ranked by relevance, which SQL can't
  // order by, so PostgreSQL returns the matches and they are ranked in memory.
  if (query.q && query.sort === "featured") {
    const matches = await productRepository.findMany(where);
    return queryProducts(matches, query);
  }

  const total = await productRepository.count(where);
  const { page, pageSize, totalPages, skip } = paginate(total, query.page, query.pageSize);
  const items = await productRepository.findMany(where, { orderBy: PRODUCT_ORDER_BY[query.sort], skip, take: pageSize });
  return { items, total, page, pageSize, totalPages };
});

const getRelatedCached = cached("related", async (product: Product, limit: number) => {
  const candidates = await productRepository.findMany(
    {
      slug: { not: product.slug },
      OR: [{ categorySlug: product.categorySlug }, ...(product.tags.length ? [{ tags: { hasSome: product.tags } }] : [])],
    },
    { take: 48 },
  );
  return findRelatedProducts(product, candidates, limit);
});

const getFeaturedCached = cached("featured", (limit: number) =>
  productRepository.findMany({ featured: true }, { orderBy: [{ rating: "desc" }, { slug: "asc" }], take: limit }),
);

const getDealsCached = cached("deals", async (limit: number) => {
  const onSale = await productRepository.findMany({ compareAtPrice: { not: null }, stock: { gt: 0 } });
  const discount = (p: Product) => (p.compareAtPrice! - p.price) / p.compareAtPrice!;
  return onSale.sort((a, b) => discount(b) - discount(a)).slice(0, limit);
});

const getNewArrivalsCached = cached("new", (limit: number) =>
  productRepository.findMany({}, { orderBy: PRODUCT_ORDER_BY.newest, take: limit }),
);

export const catalogService = {
  getCategories(): Promise<Category[]> {
    return getCategoriesCached();
  },

  async getCategory(slug: string): Promise<Category> {
    const category = (await getCategoriesCached()).find((c) => c.slug === slug);
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  getCategoryProductCounts(): Promise<Record<string, number>> {
    return getCountsCached();
  },

  searchProducts(query: ProductQuery): Promise<Paginated<Product>> {
    return searchCached(query);
  },

  async getProduct(slug: string): Promise<Product> {
    const product = await getProductCached(slug);
    if (!product) throw new NotFoundError("Product");
    return product;
  },

  getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    return getRelatedCached(product, limit);
  },

  getFeaturedProducts(limit = 8): Promise<Product[]> {
    return getFeaturedCached(limit);
  },

  getDeals(limit = 4): Promise<Product[]> {
    return getDealsCached(limit);
  },

  getNewArrivals(limit = 8): Promise<Product[]> {
    return getNewArrivalsCached(limit);
  },

  /** Search-as-you-type suggestions for the header search box. */
  async suggest(q: string, limit = 6): Promise<Product[]> {
    const result = await searchCached({ q, sort: "featured", page: 1, pageSize: limit });
    return result.items;
  },

  // ---------- Admin operations (protected by the API layer) ----------

  async createProduct(input: ProductInput): Promise<Product> {
    const category = await categoryRepository.getBySlug(input.categorySlug);
    if (!category) throw new ValidationError("Unknown category.", { fieldErrors: { categorySlug: "Unknown category." } });
    const product = await productRepository.create({ ...input, art: { ...input.art, icon: input.art.icon as ArtIcon } });
    revalidateTag(CATALOG_TAG);
    return product;
  },

  async updateProduct(slug: string, changes: ProductUpdateInput): Promise<Product> {
    const existing = await productRepository.getBySlug(slug);
    if (!existing) throw new NotFoundError("Product");
    const { compareAtPrice, ...rest } = changes;
    const updated: Product = {
      ...existing,
      ...rest,
      compareAtPrice: compareAtPrice === null ? undefined : (compareAtPrice ?? existing.compareAtPrice),
    };
    if (updated.compareAtPrice !== undefined && updated.compareAtPrice <= updated.price) {
      throw new ValidationError("The compare-at price must be higher than the price.", {
        fieldErrors: { compareAtPrice: "Must be higher than the price." },
      });
    }
    const saved = await productRepository.replace(updated);
    revalidateTag(CATALOG_TAG);
    return saved;
  },

  async deleteProduct(slug: string): Promise<void> {
    await productRepository.delete(slug);
    revalidateTag(CATALOG_TAG);
  },
};
