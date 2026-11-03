import "server-only";
import { DeleteCommand, GetCommand, PutCommand, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";
import { keys } from "@/lib/db/keys";
import { stripKeys } from "@/lib/db/utils";
import type { Category } from "@/types";

export const categoryRepository = {
  /** All categories live in one small partition, so a single Query returns them. */
  async list(): Promise<Category[]> {
    return withDb("category.list", async () => {
      const res = await db().send(
        new QueryCommand({
          TableName: tableName(),
          KeyConditionExpression: "PK = :pk",
          ExpressionAttributeValues: { ":pk": keys.categoryPartition },
        }),
      );
      return (res.Items ?? [])
        .map((i) => stripKeys<Category>(i))
        .sort((a, b) => a.sortOrder - b.sortOrder);
    });
  },

  async getBySlug(slug: string): Promise<Category | null> {
    return withDb("category.get", async () => {
      const res = await db().send(new GetCommand({ TableName: tableName(), Key: keys.category(slug) }));
      return res.Item ? stripKeys<Category>(res.Item) : null;
    });
  },

  async put(category: Category): Promise<void> {
    await withDb("category.put", () =>
      db().send(
        new PutCommand({
          TableName: tableName(),
          Item: { ...keys.category(category.slug), entityType: "Category", ...category },
        }),
      ),
    );
  },

  async delete(slug: string): Promise<void> {
    await withDb("category.delete", () =>
      db().send(new DeleteCommand({ TableName: tableName(), Key: keys.category(slug) })),
    );
  },
};
