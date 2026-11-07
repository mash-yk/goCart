import "server-only";
import { DeleteCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { isConditionalCheckFailed, withDb } from "@/lib/db/errors";
import { guestExpiry, keys } from "@/lib/db/keys";
import { batchDelete, queryOwnerItems } from "@/lib/db/repositories/owner-items";
import type { Owner, WishlistItem } from "@/types";

const inMemoryWishlists = new Map<string, Map<string, WishlistItem>>();

function getMemoryWishlist(ownerId: string): Map<string, WishlistItem> {
  let list = inMemoryWishlists.get(ownerId);
  if (!list) {
    list = new Map<string, WishlistItem>();
    inMemoryWishlists.set(ownerId, list);
  }
  return list;
}

export const wishlistRepository = {
  async list(owner: Owner): Promise<WishlistItem[]> {
    try {
      const items = await queryOwnerItems(owner.id, keys.wishlistPrefix);
      return items
        .map((i) => ({ productSlug: i.productSlug as string, addedAt: i.addedAt as string }))
        .sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    } catch {
      const list = getMemoryWishlist(owner.id);
      return Array.from(list.values()).sort((a, b) => b.addedAt.localeCompare(a.addedAt));
    }
  },

  /**
   * Adds a product. The condition expression prevents duplicates at the database level.
   * Returns false when the product was already in the wishlist.
   */
  async add(owner: Owner, productSlug: string, addedAt = new Date().toISOString()): Promise<boolean> {
    try {
      await db().send(
        new PutCommand({
          TableName: tableName(),
          Item: {
            ...keys.wishlistItem(owner.id, productSlug),
            entityType: "WishlistItem",
            productSlug,
            addedAt,
            ...(owner.kind === "guest" ? { expiresAt: guestExpiry() } : {}),
          },
          ConditionExpression: "attribute_not_exists(SK)",
        }),
      );
      return true;
    } catch (error) {
      if (isConditionalCheckFailed(error)) return false;
      try {
        await withDb("wishlist.add", () => Promise.reject(error));
        return true;
      } catch {
        const list = getMemoryWishlist(owner.id);
        if (list.has(productSlug)) return false;
        list.set(productSlug, { productSlug, addedAt });
        return true;
      }
    }
  },

  async remove(owner: Owner, productSlug: string): Promise<void> {
    try {
      await withDb("wishlist.remove", () =>
        db().send(
          new DeleteCommand({ TableName: tableName(), Key: keys.wishlistItem(owner.id, productSlug) }),
        ),
      );
    } catch {
      const list = getMemoryWishlist(owner.id);
      list.delete(productSlug);
    }
  },

  async clear(owner: Owner): Promise<void> {
    try {
      const items = await queryOwnerItems(owner.id, keys.wishlistPrefix);
      await batchDelete(items.map((i) => ({ PK: i.PK as string, SK: i.SK as string })));
    } catch {
      const list = getMemoryWishlist(owner.id);
      list.clear();
    }
  },
};
