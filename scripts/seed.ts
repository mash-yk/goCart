/**
 * Loads the categories and products from src/data/catalog.ts into DynamoDB.
 * Uses the same key layout as the application repositories. Safe to re-run:
 * existing catalogue items are overwritten, user data is untouched.
 *
 *   npm run db:seed
 */
import { BatchWriteCommand, type BatchWriteCommandOutput } from "@aws-sdk/lib-dynamodb";
import { categories, products } from "../src/data/catalog";
import { keys } from "../src/lib/db/keys";
import { TABLE, describeTarget, docClient } from "./env";

async function batchPut(items: Record<string, unknown>[]) {
  for (let i = 0; i < items.length; i += 25) {
    let requests: unknown[] | undefined = items.slice(i, i + 25).map((Item) => ({ PutRequest: { Item } }));
    let attempt = 0;
    while (requests && requests.length > 0) {
      const res: BatchWriteCommandOutput = await docClient.send(new BatchWriteCommand({ RequestItems: { [TABLE]: requests as never } }));
      requests = res.UnprocessedItems?.[TABLE];
      if (requests?.length) {
        attempt++;
        if (attempt > 6) throw new Error("Too many unprocessed items while seeding.");
        await new Promise((r) => setTimeout(r, 100 * 2 ** attempt));
      }
    }
  }
}

async function main() {
  console.log(`Seeding "${TABLE}" on ${describeTarget()}...`);

  const categoryItems = categories.map((c) => ({ ...keys.category(c.slug), entityType: "Category", ...c }));
  const productItems = products.map((p) => ({
    ...keys.product(p.slug),
    ...keys.productGsi1(p.categorySlug, p.slug),
    ...keys.productGsi2(p.createdAt, p.slug),
    entityType: "Product",
    ...p,
  }));

  const categorySlugs = new Set(categories.map((c) => c.slug));
  const orphan = products.find((p) => !categorySlugs.has(p.categorySlug));
  if (orphan) throw new Error(`Product "${orphan.slug}" uses unknown category "${orphan.categorySlug}".`);

  await batchPut(categoryItems);
  await batchPut(productItems);
  console.log(`Seeded ${categoryItems.length} categories and ${productItems.length} products.`);
}

main().catch((error) => {
  console.error("Seeding failed:", error);
  process.exit(1);
});
