import "server-only";
import {
  BatchGetCommand,
  DeleteCommand,
  GetCommand,
  PutCommand,
  QueryCommand,
  type QueryCommandInput,
} from "@aws-sdk/lib-dynamodb";
import { products as staticProducts } from "@/data/catalog";
import { db, tableName } from "@/lib/db/client";
import { isConditionalCheckFailed, withDb } from "@/lib/db/errors";
import { indexes, keys } from "@/lib/db/keys";
import { chunk, stripKeys } from "@/lib/db/utils";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { Product } from "@/types";

function toItem(product: Product) {
  return {
    ...keys.product(product.slug),
    ...keys.productGsi1(product.categorySlug, product.slug),
    ...keys.productGsi2(product.createdAt, product.slug),
    entityType: "Product",
    ...product,
  };
}

/** Runs a Query and follows LastEvaluatedKey until every page has been read. */
async function queryAll(input: QueryCommandInput): Promise<Record<string, unknown>[]> {
  const items: Record<string, unknown>[] = [];
  let ExclusiveStartKey: Record<string, unknown> | undefined;
  do {
    const res = await db().send(new QueryCommand({ ...input, ExclusiveStartKey }));
    items.push(...(res.Items ?? []));
    ExclusiveStartKey = res.LastEvaluatedKey;
  } while (ExclusiveStartKey);
  return items;
}

export const productRepository = {
  /** Every product, newest first, through GSI2 (GSI2PK = "PRODUCTS"). */
  async listAll(): Promise<Product[]> {
    return withDb("product.listAll", async () => {
      const items = await queryAll({
        TableName: tableName(),
        IndexName: indexes.allProducts,
        KeyConditionExpression: "GSI2PK = :pk",
        ExpressionAttributeValues: { ":pk": keys.allProductsPartition },
        ScanIndexForward: false,
      });
      return items.map((i) => stripKeys<Product>(i));
    });
  },

  /** Products in one category through GSI1 (GSI1PK = "CATEGORY#<slug>"). */
  async listByCategory(categorySlug: string): Promise<Product[]> {
    return withDb("product.listByCategory", async () => {
      const items = await queryAll({
        TableName: tableName(),
        IndexName: indexes.byCategory,
        KeyConditionExpression: "GSI1PK = :pk",
        ExpressionAttributeValues: { ":pk": keys.categoryProductsPartition(categorySlug) },
      });
      return items.map((i) => stripKeys<Product>(i));
    });
  },

  async getBySlug(slug: string): Promise<Product | null> {
    try {
      return await withDb("product.get", async () => {
        const res = await db().send(new GetCommand({ TableName: tableName(), Key: keys.product(slug) }));
        return res.Item ? stripKeys<Product>(res.Item) : null;
      });
    } catch {
      return staticProducts.find((p) => p.slug === slug) ?? null;
    }
  },

  /** Fetches many products at once (cart and wishlist hydration). Missing slugs are skipped. */
  async getManyBySlugs(slugs: string[]): Promise<Map<string, Product>> {
    const unique = [...new Set(slugs)];
    const result = new Map<string, Product>();
    if (unique.length === 0) return result;

    try {
      await withDb("product.batchGet", async () => {
        for (const group of chunk(unique, 100)) {
          let requestKeys: Record<string, unknown>[] | undefined = group.map((s) => keys.product(s));
          let attempts = 0;
          // BatchGet may return UnprocessedKeys under load; retry them with backoff.
          while (requestKeys && requestKeys.length > 0 && attempts < 5) {
            const res = await db().send(
              new BatchGetCommand({ RequestItems: { [tableName()]: { Keys: requestKeys } } }),
            );
            for (const item of res.Responses?.[tableName()] ?? []) {
              const product = stripKeys<Product>(item);
              result.set(product.slug, product);
            }
            requestKeys = res.UnprocessedKeys?.[tableName()]?.Keys as Record<string, unknown>[] | undefined;
            attempts++;
            if (requestKeys?.length) await new Promise((r) => setTimeout(r, 50 * 2 ** attempts));
          }
        }
      });
    } catch {
      for (const slug of unique) {
        const p = staticProducts.find((prod) => prod.slug === slug);
        if (p) result.set(slug, p);
      }
    }
    return result;
  },

  /** Creates a product. Fails if a product with the same slug already exists. */
  async create(product: Product): Promise<Product> {
    try {
      await db().send(
        new PutCommand({
          TableName: tableName(),
          Item: toItem(product),
          ConditionExpression: "attribute_not_exists(PK)",
        }),
      );
      return product;
    } catch (error) {
      if (isConditionalCheckFailed(error)) {
        throw new ConflictError("PRODUCT_EXISTS", `A product with slug "${product.slug}" already exists.`);
      }
      return withDb("product.create", () => Promise.reject(error));
    }
  },

  /** Inserts or replaces a product (used by the seed script). */
  async upsert(product: Product): Promise<void> {
    await withDb("product.upsert", () =>
      db().send(new PutCommand({ TableName: tableName(), Item: toItem(product) })),
    );
  },

  /** Replaces an existing product. Fails if it does not exist. */
  async replace(product: Product): Promise<Product> {
    try {
      await db().send(
        new PutCommand({
          TableName: tableName(),
          Item: toItem(product),
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
      return product;
    } catch (error) {
      if (isConditionalCheckFailed(error)) throw new NotFoundError("Product");
      return withDb("product.replace", () => Promise.reject(error));
    }
  },

  async delete(slug: string): Promise<void> {
    try {
      await db().send(
        new DeleteCommand({
          TableName: tableName(),
          Key: keys.product(slug),
          ConditionExpression: "attribute_exists(PK)",
        }),
      );
    } catch (error) {
      if (isConditionalCheckFailed(error)) throw new NotFoundError("Product");
      return withDb("product.delete", () => Promise.reject(error));
    }
  },
};
