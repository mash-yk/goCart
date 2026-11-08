import "server-only";
import { db } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";

export const maintenanceRepository = {
  /** Deletes guest cart and wishlist rows whose expiry date has passed. */
  async deleteExpiredGuestData(now = new Date()): Promise<{ cartItems: number; wishlistItems: number }> {
    return withDb("maintenance.deleteExpiredGuestData", async () => {
      const where = { guestId: { not: null }, expiresAt: { lt: now } };
      const [cart, wishlist] = await db().$transaction([
        db().cartItem.deleteMany({ where }),
        db().wishlistItem.deleteMany({ where }),
      ]);
      return { cartItems: cart.count, wishlistItems: wishlist.count };
    });
  },

  /** Cheap round-trip used by the health check. */
  async ping(): Promise<void> {
    await db().$queryRaw`SELECT 1`;
  },
};
