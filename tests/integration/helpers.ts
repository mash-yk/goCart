import { categories, products } from "@/data/catalog";
import { db } from "@/lib/db/client";
import { categoryRepository } from "@/lib/db/repositories/category.repository";
import { productRepository } from "@/lib/db/repositories/product.repository";

/** Empties every table and loads the seed catalog, so each test file starts the same way. */
export async function resetDatabase() {
  await db().$executeRawUnsafe(
    'TRUNCATE "order_items", "orders", "cart_items", "wishlist_items", "newsletter_subscribers", "users", "products", "categories" CASCADE',
  );
  for (const category of categories) await categoryRepository.upsert(category);
  for (const product of products) await productRepository.upsert(product);
}

export async function stockOf(slug: string): Promise<number> {
  return (await db().product.findUniqueOrThrow({ where: { slug } })).stock;
}

export const address = {
  addressLine1: "12 Road 5",
  city: "Dhaka",
  state: "Dhaka",
  postalCode: "1212",
  country: "BD",
};
