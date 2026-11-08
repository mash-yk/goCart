import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { buildSearchText } from "@/lib/business/catalog-query";
import { db } from "@/lib/db/client";
import { isRecordNotFound, isUniqueViolation, withDb } from "@/lib/db/errors";
import { toProduct } from "@/lib/db/mappers";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { Product } from "@/types";

type ProductWrite = Omit<Product, "createdAt" | "updatedAt">;

/** Column values for an insert or update; search_text is always rebuilt from the product. */
function toData(product: ProductWrite) {
  return {
    name: product.name,
    tagline: product.tagline,
    description: product.description,
    categorySlug: product.categorySlug,
    price: product.price,
    compareAtPrice: product.compareAtPrice ?? null,
    rating: product.rating,
    reviewCount: product.reviewCount,
    stock: product.stock,
    featured: product.featured,
    tags: product.tags,
    features: product.features,
    specs: product.specs as unknown as Prisma.InputJsonValue,
    colors: product.colors as unknown as Prisma.InputJsonValue,
    art: product.art as unknown as Prisma.InputJsonValue,
    images: product.images,
    searchText: buildSearchText(product),
  };
}

export const productRepository = {
  async findMany(
    where: Prisma.ProductWhereInput,
    options: { orderBy?: Prisma.ProductOrderByWithRelationInput[]; skip?: number; take?: number } = {},
  ): Promise<Product[]> {
    return withDb("product.findMany", async () => {
      const rows = await db().product.findMany({ where, ...options });
      return rows.map(toProduct);
    });
  },

  async count(where: Prisma.ProductWhereInput): Promise<number> {
    return withDb("product.count", () => db().product.count({ where }));
  },

  /** Number of products in each category, for the category grid and filters. */
  async countByCategory(): Promise<Record<string, number>> {
    return withDb("product.countByCategory", async () => {
      const groups = await db().product.groupBy({ by: ["categorySlug"], _count: { _all: true } });
      return Object.fromEntries(groups.map((g) => [g.categorySlug, g._count._all]));
    });
  },

  async getBySlug(slug: string): Promise<Product | null> {
    return withDb("product.get", async () => {
      const row = await db().product.findUnique({ where: { slug } });
      return row ? toProduct(row) : null;
    });
  },

  /** Fetches many products at once. Missing slugs are skipped. */
  async getManyBySlugs(slugs: string[]): Promise<Map<string, Product>> {
    const unique = [...new Set(slugs)];
    if (unique.length === 0) return new Map();
    return withDb("product.getMany", async () => {
      const rows = await db().product.findMany({ where: { slug: { in: unique } } });
      return new Map(rows.map((row) => [row.slug, toProduct(row)]));
    });
  },

  async create(product: ProductWrite): Promise<Product> {
    try {
      const row = await db().product.create({ data: { slug: product.slug, ...toData(product) } });
      return toProduct(row);
    } catch (error) {
      if (isUniqueViolation(error)) {
        throw new ConflictError("PRODUCT_EXISTS", `A product with slug "${product.slug}" already exists.`);
      }
      return withDb("product.create", () => Promise.reject(error));
    }
  },

  /** Inserts or updates by slug (used by the seed script). */
  async upsert(product: ProductWrite & { createdAt?: string }): Promise<Product> {
    return withDb("product.upsert", async () => {
      const data = toData(product);
      const row = await db().product.upsert({
        where: { slug: product.slug },
        create: { slug: product.slug, ...data, ...(product.createdAt ? { createdAt: new Date(product.createdAt) } : {}) },
        update: data,
      });
      return toProduct(row);
    });
  },

  async replace(product: ProductWrite): Promise<Product> {
    try {
      const row = await db().product.update({ where: { slug: product.slug }, data: toData(product) });
      return toProduct(row);
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundError("Product");
      return withDb("product.replace", () => Promise.reject(error));
    }
  },

  /**
   * Deletes a product. Cart and wishlist lines that point at it are removed by the
   * database (ON DELETE CASCADE); past orders keep their snapshot (ON DELETE SET NULL).
   */
  async delete(slug: string): Promise<void> {
    try {
      await db().product.delete({ where: { slug } });
    } catch (error) {
      if (isRecordNotFound(error)) throw new NotFoundError("Product");
      return withDb("product.delete", () => Promise.reject(error));
    }
  },
};
