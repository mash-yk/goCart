import "server-only";
import { BatchWriteCommand, type BatchWriteCommandOutput, QueryCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";
import { keys } from "@/lib/db/keys";
import { chunk } from "@/lib/db/utils";

/** Reads every item under OWNER#<id> whose sort key starts with a prefix (CART# or WISHLIST#). */
export async function queryOwnerItems(ownerId: string, prefix: string): Promise<Record<string, unknown>[]> {
  return withDb("owner.query", async () => {
    const items: Record<string, unknown>[] = [];
    let ExclusiveStartKey: Record<string, unknown> | undefined;
    do {
      const res = await db().send(
        new QueryCommand({
          TableName: tableName(),
          KeyConditionExpression: "PK = :pk AND begins_with(SK, :prefix)",
          ExpressionAttributeValues: { ":pk": keys.owner(ownerId), ":prefix": prefix },
          ExclusiveStartKey,
        }),
      );
      items.push(...(res.Items ?? []));
      ExclusiveStartKey = res.LastEvaluatedKey;
    } while (ExclusiveStartKey);
    return items;
  });
}

/** Deletes many keys with BatchWrite (25 per request), retrying unprocessed items. */
export async function batchDelete(keyList: { PK: string; SK: string }[]): Promise<void> {
  if (keyList.length === 0) return;
  await withDb("owner.batchDelete", async () => {
    for (const group of chunk(keyList, 25)) {
      let requests: unknown[] | undefined = group.map((Key) => ({ DeleteRequest: { Key } }));
      let attempts = 0;
      while (requests && requests.length > 0 && attempts < 5) {
        const res: BatchWriteCommandOutput = await db().send(
          new BatchWriteCommand({
            RequestItems: { [tableName()]: requests as never },
          }),
        );
        requests = res.UnprocessedItems?.[tableName()];
        attempts++;
        if (requests?.length) await new Promise((r) => setTimeout(r, 50 * 2 ** attempts));
      }
    }
  });
}
