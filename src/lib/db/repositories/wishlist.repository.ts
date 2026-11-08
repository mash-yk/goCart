import "server-only";
import { db } from "@/lib/db/client";
import { isUniqueViolation, withDb } from "@/lib/db/errors";
import { ownerExpiry, ownerWhere } from "@/lib/db/repositories/owner";
import type { Owner, WishlistItem } from "@/types";

export const wishlistRepository = {
  async list(owner: Owner): Promise<WishlistItem[]> {
    return withDb("wishlist.list", async () => {
      const rows = await db().wishlistItem.findMany({ where: ownerWhere(owner), orderBy: { createdAt: "desc" } });
      return rows.map((r) => ({ productSlug: r.productSlug, addedAt: r.createdAt.toISOString() }));
    });
  },

  /**
   * Adds a product. The unique index on (owner, product) prevents duplicates at the
   * database level. Returns false when the product was already in the wishlist.
   */
  async add(owner: Owner, productSlug: string, addedAt?: string): Promise<boolean> {
    try {
      await db().wishlistItem.create({
        data: {
          ...ownerWhere(owner),
          productSlug,
          expiresAt: ownerExpiry(owner),
          ...(addedAt ? { createdAt: new Date(addedAt) } : {}),
        },
      });
      return true;
    } catch (error) {
      if (isUniqueViolation(error)) return false;
      return withDb("wishlist.add", () => Promise.reject(error));
    }
  },

  async remove(owner: Owner, productSlug: string): Promise<void> {
    await withDb("wishlist.remove", () =>
      db().wishlistItem.deleteMany({ where: { ...ownerWhere(owner), productSlug } }),
    );
  },

  async clear(owner: Owner): Promise<void> {
    await withDb("wishlist.clear", () => db().wishlistItem.deleteMany({ where: ownerWhere(owner) }));
  },
};
