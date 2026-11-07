import "server-only";
import { DeleteCommand, GetCommand, PutCommand } from "@aws-sdk/lib-dynamodb";
import { db, tableName } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";
import { guestExpiry, keys } from "@/lib/db/keys";
import { batchDelete, queryOwnerItems } from "@/lib/db/repositories/owner-items";
import type { CartItem, Owner } from "@/types";

const inMemoryCarts = new Map<string, Map<string, CartItem>>();

function getMemoryCart(ownerId: string): Map<string, CartItem> {
  let cart = inMemoryCarts.get(ownerId);
  if (!cart) {
    cart = new Map<string, CartItem>();
    inMemoryCarts.set(ownerId, cart);
  }
  return cart;
}

function toCartItem(item: Record<string, unknown>): CartItem {
  return {
    productSlug: item.productSlug as string,
    quantity: Number(item.quantity),
    addedAt: item.addedAt as string,
    updatedAt: item.updatedAt as string,
  };
}

export const cartRepository = {
  async list(owner: Owner): Promise<CartItem[]> {
    try {
      const items = await queryOwnerItems(owner.id, keys.cartPrefix);
      return items.map(toCartItem).sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    } catch {
      const cart = getMemoryCart(owner.id);
      return Array.from(cart.values()).sort((a, b) => a.addedAt.localeCompare(b.addedAt));
    }
  },

  async get(owner: Owner, productSlug: string): Promise<CartItem | null> {
    try {
      return await withDb("cart.get", async () => {
        const res = await db().send(
          new GetCommand({ TableName: tableName(), Key: keys.cartItem(owner.id, productSlug) }),
        );
        return res.Item ? toCartItem(res.Item) : null;
      });
    } catch {
      const cart = getMemoryCart(owner.id);
      return cart.get(productSlug) ?? null;
    }
  },

  /** Writes the final quantity for a line. Guest lines expire automatically via TTL. */
  async setQuantity(owner: Owner, productSlug: string, quantity: number, addedAt?: string): Promise<CartItem> {
    const now = new Date().toISOString();
    const item: CartItem = { productSlug, quantity, addedAt: addedAt ?? now, updatedAt: now };
    try {
      await withDb("cart.setQuantity", () =>
        db().send(
          new PutCommand({
            TableName: tableName(),
            Item: {
              ...keys.cartItem(owner.id, productSlug),
              entityType: "CartItem",
              ...item,
              ...(owner.kind === "guest" ? { expiresAt: guestExpiry() } : {}),
            },
          }),
        ),
      );
    } catch {
      const cart = getMemoryCart(owner.id);
      cart.set(productSlug, item);
    }
    return item;
  },

  async remove(owner: Owner, productSlug: string): Promise<void> {
    try {
      await withDb("cart.remove", () =>
        db().send(new DeleteCommand({ TableName: tableName(), Key: keys.cartItem(owner.id, productSlug) })),
      );
    } catch {
      const cart = getMemoryCart(owner.id);
      cart.delete(productSlug);
    }
  },

  async clear(owner: Owner): Promise<void> {
    try {
      const items = await queryOwnerItems(owner.id, keys.cartPrefix);
      await batchDelete(items.map((i) => ({ PK: i.PK as string, SK: i.SK as string })));
    } catch {
      const cart = getMemoryCart(owner.id);
      cart.clear();
    }
  },
};
