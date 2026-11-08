import "server-only";
import { db } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";
import { ownerExpiry, ownerProductKey, ownerWhere } from "@/lib/db/repositories/owner";
import type { CartItem, Owner } from "@/types";

type CartRow = { productSlug: string; quantity: number; createdAt: Date; updatedAt: Date };

function toCartItem(row: CartRow): CartItem {
  return {
    productSlug: row.productSlug,
    quantity: row.quantity,
    addedAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export const cartRepository = {
  async list(owner: Owner): Promise<CartItem[]> {
    return withDb("cart.list", async () => {
      const rows = await db().cartItem.findMany({ where: ownerWhere(owner), orderBy: { createdAt: "asc" } });
      return rows.map(toCartItem);
    });
  },

  async get(owner: Owner, productSlug: string): Promise<CartItem | null> {
    return withDb("cart.get", async () => {
      const row = await db().cartItem.findUnique({ where: ownerProductKey(owner, productSlug) });
      return row ? toCartItem(row) : null;
    });
  },

  /** Sets the final quantity for a line, creating it if needed (one UPSERT). */
  async setQuantity(owner: Owner, productSlug: string, quantity: number, addedAt?: string): Promise<CartItem> {
    return withDb("cart.setQuantity", async () => {
      const expiresAt = ownerExpiry(owner);
      const row = await db().cartItem.upsert({
        where: ownerProductKey(owner, productSlug),
        create: {
          ...ownerWhere(owner),
          productSlug,
          quantity,
          expiresAt,
          ...(addedAt ? { createdAt: new Date(addedAt) } : {}),
        },
        update: { quantity, expiresAt },
      });
      return toCartItem(row);
    });
  },

  async remove(owner: Owner, productSlug: string): Promise<void> {
    await withDb("cart.remove", () => db().cartItem.deleteMany({ where: { ...ownerWhere(owner), productSlug } }));
  },

  async clear(owner: Owner): Promise<void> {
    await withDb("cart.clear", () => db().cartItem.deleteMany({ where: ownerWhere(owner) }));
  },
};
