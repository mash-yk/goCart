import "server-only";
import { revalidateTag, unstable_cache } from "next/cache";
import { categories as staticCategories, products as staticProducts } from "@/data/catalog";
import { categoryRepository } from "@/lib/db/repositories/category.repository";
import { productRepository } from "@/lib/db/repositories/product.repository";
import { findRelatedProducts, queryProducts } from "@/lib/business/catalog-query";
import { NotFoundError, ValidationError } from "@/lib/errors";
import type { ProductInput, ProductUpdateInput } from "@/lib/validation/schemas";
import type { ArtIcon, Category, Paginated, Product, ProductQuery } from "@/types";

const CATALOG_TAG = "catalog";
const CATALOG_TTL_SECONDS = 300;

/**
 * The catalogue is read-heavy, so the product list is read from DynamoDB
 * once and cached for 5 minutes. Writes call `revalidateTag("catalog")` to refresh it.
 * If DynamoDB is not yet provisioned in development, it gracefully falls back
 * to the bundled seed catalogue.
 */
const getAllProductsCached = unstable_cache(
  async (): Promise<Product[]> => {
    try {
      const items = await productRepository.listAll();
      return items.length > 0 ? items : staticProducts;
    } catch {
      return staticProducts;
    }
  },
  ["products:all"],
  {
    tags: [CATALOG_TAG],
    revalidate: CATALOG_TTL_SECONDS,
  }
);

const getCategoriesCached = unstable_cache(
  async (): Promise<Category[]> => {
    try {
      const items = await categoryRepository.list();
      return items.length > 0 ? items : staticCategories;
    } catch {
      return staticCategories;
    }
  },
  ["categories:all"],
  {
    tags: [CATALOG_TAG],
    revalidate: CATALOG_TTL_SECONDS,
  }
);

export const catalogService = {
  getCategories(): Promise<Category[]> {
    return getCategoriesCached();
  },

  async getCategory(slug: string): Promise<Category> {
    const categories = await getCategoriesCached();
    const category = categories.find((c) => c.slug === slug);
    if (!category) throw new NotFoundError("Category");
    return category;
  },

  async getCategoryProductCounts(): Promise<Record<string, number>> {
    const products = await getAllProductsCached();
    return products.reduce<Record<string, number>>((acc, p) => {
      acc[p.categorySlug] = (acc[p.categorySlug] ?? 0) + 1;
      return acc;
    }, {});
  },

  async searchProducts(query: ProductQuery): Promise<Paginated<Product>> {
    const products = await getAllProductsCached();
    return queryProducts(products, query);
  },

  async getProduct(slug: string): Promise<Product> {
    const products = await getAllProductsCached();
    const product = products.find((p) => p.slug === slug) ?? (await productRepository.getBySlug(slug));
    if (!product) throw new NotFoundError("Product");
    return product;
  },

  async getRelatedProducts(product: Product, limit = 4): Promise<Product[]> {
    return findRelatedProducts(product, await getAllProductsCached(), limit);
  },

  async getFeaturedProducts(limit = 8): Promise<Product[]> {
    const products = await getAllProductsCached();
    return products
      .filter((p) => p.featured)
      .sort((a, b) => b.rating - a.rating)
      .slice(0, limit);
  },

  async getDeals(limit = 4): Promise<Product[]> {
    const products = await getAllProductsCached();
    return products
      .filter((p) => p.compareAtPrice && p.compareAtPrice > p.price && p.stock > 0)
      .sort((a, b) => (b.compareAtPrice! - b.price) / b.compareAtPrice! - (a.compareAtPrice! - a.price) / a.compareAtPrice!)
      .slice(0, limit);
  },

  async getNewArrivals(limit = 8): Promise<Product[]> {
    const products = await getAllProductsCached();
    return [...products].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, limit);
  },

  /** Search-as-you-type suggestions for the header search box. */
  async suggest(q: string, limit = 6): Promise<Product[]> {
    const result = queryProducts(await getAllProductsCached(), {
      q,
      sort: "featured",
      page: 1,
      pageSize: limit,
    });
    return result.items;
  },

  // ---------- Admin operations (protected by the API layer) ----------

  async createProduct(input: ProductInput): Promise<Product> {
    const category = await categoryRepository.getBySlug(input.categorySlug);
    if (!category) throw new ValidationError("Unknown category.", { fieldErrors: { categorySlug: "Unknown category." } });
    const now = new Date().toISOString();
    const product: Product = { ...input, art: { ...input.art, icon: input.art.icon as ArtIcon }, createdAt: now, updatedAt: now };
    await productRepository.create(product);
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
      updatedAt: new Date().toISOString(),
    };
    if (updated.compareAtPrice !== undefined && updated.compareAtPrice <= updated.price) {
      throw new ValidationError("compareAtPrice must be greater than price.");
    }
    await productRepository.replace(updated);
    revalidateTag(CATALOG_TAG);
    return updated;
  },

  async deleteProduct(slug: string): Promise<void> {
    await productRepository.delete(slug);
    revalidateTag(CATALOG_TAG);
  },
};
