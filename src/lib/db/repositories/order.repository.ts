import "server-only";
import type { Prisma } from "@/generated/prisma/client";
import { db } from "@/lib/db/client";
import { withDb } from "@/lib/db/errors";
import { toOrder } from "@/lib/db/mappers";
import { ownerWhere } from "@/lib/db/repositories/owner";
import { AppError, ConflictError } from "@/lib/errors";
import type { Order, Owner, PaymentStatus } from "@/types";

export type NewOrder = Omit<Order, "ownerId" | "status" | "stripeSessionId" | "createdAt" | "updatedAt">;

const withItems = { items: true } as const;

/** Runs a transaction, letting application errors (like OUT_OF_STOCK) through unchanged. */
async function transaction<T>(operation: string, fn: (tx: Prisma.TransactionClient) => Promise<T>): Promise<T> {
  try {
    return await db().$transaction(fn);
  } catch (error) {
    if (error instanceof AppError) throw error;
    return withDb(operation, () => Promise.reject(error));
  }
}

export const orderRepository = {
  /**
   * Places an order in one transaction:
   * 1. reserves stock for every line (fails with OUT_OF_STOCK if any product ran out),
   * 2. saves the order and its line items,
   * 3. optionally empties the owner's cart.
   * If any step fails, nothing is written.
   */
  async create(owner: Owner, order: NewOrder, options: { clearCart: boolean }): Promise<Order> {
    return transaction("order.create", async (tx) => {
      for (const item of order.items) {
        const reserved = await tx.product.updateMany({
          where: { slug: item.slug, stock: { gte: item.quantity } },
          data: { stock: { decrement: item.quantity } },
        });
        if (reserved.count === 0) {
          throw new ConflictError("OUT_OF_STOCK", `Sorry, ${item.name} doesn't have enough stock left. Please update your cart.`);
        }
      }

      const row = await tx.order.create({
        data: {
          id: order.id,
          ...ownerWhere(owner),
          customerName: order.customer.name,
          customerEmail: order.customer.email,
          customerPhone: order.customer.phone,
          addressLine1: order.shippingAddress.addressLine1,
          addressLine2: order.shippingAddress.addressLine2 || null,
          city: order.shippingAddress.city,
          state: order.shippingAddress.state,
          postalCode: order.shippingAddress.postalCode,
          country: order.shippingAddress.country,
          itemCount: order.itemCount,
          subtotal: order.subtotal,
          shipping: order.shipping,
          savings: order.savings,
          total: order.total,
          paymentMethod: order.paymentMethod,
          paymentStatus: order.paymentStatus,
          items: {
            create: order.items.map((item) => ({
              productSlug: item.slug,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              lineTotal: item.lineTotal,
              art: item.art as unknown as Prisma.InputJsonValue,
            })),
          },
        },
        include: withItems,
      });

      if (options.clearCart) await tx.cartItem.deleteMany({ where: ownerWhere(owner) });
      return toOrder(row);
    });
  },

  async getById(id: string): Promise<Order | null> {
    return withDb("order.get", async () => {
      const row = await db().order.findUnique({ where: { id }, include: withItems });
      return row ? toOrder(row) : null;
    });
  },

  async listByOwner(owner: Owner): Promise<Order[]> {
    return withDb("order.listByOwner", async () => {
      const rows = await db().order.findMany({
        where: ownerWhere(owner),
        include: withItems,
        orderBy: { createdAt: "desc" },
      });
      return rows.map(toOrder);
    });
  },

  /** Moves orders placed as a guest onto the account the guest just signed in to. */
  async claimGuestOrders(guestId: string, userId: string): Promise<number> {
    return withDb("order.claimGuestOrders", async () => {
      const result = await db().order.updateMany({ where: { guestId }, data: { guestId: null, userId } });
      return result.count;
    });
  },

  async setStripeSession(id: string, stripeSessionId: string): Promise<void> {
    await withDb("order.setStripeSession", () => db().order.update({ where: { id }, data: { stripeSessionId } }));
  },

  /**
   * Marks a Stripe order as paid and empties the buyer's cart. Safe to call twice
   * (the success page and the webhook may both report the same payment).
   */
  async markPaid(id: string, stripeSessionId: string): Promise<Order | null> {
    return transaction("order.markPaid", async (tx) => {
      const order = await tx.order.findUnique({ where: { id } });
      if (!order) return null;
      if (order.paymentStatus !== "paid") {
        await tx.order.update({ where: { id }, data: { paymentStatus: "paid", stripeSessionId } });
        const owner = order.userId ? { userId: order.userId } : order.guestId ? { guestId: order.guestId } : null;
        if (owner) await tx.cartItem.deleteMany({ where: owner });
      }
      const row = await tx.order.findUniqueOrThrow({ where: { id }, include: withItems });
      return toOrder(row);
    });
  },

  /** Cancels an unpaid order and puts its reserved stock back. Does nothing if already paid or cancelled. */
  async cancelUnpaid(id: string, paymentStatus: PaymentStatus = "failed"): Promise<Order | null> {
    return transaction("order.cancelUnpaid", async (tx) => {
      const order = await tx.order.findUnique({ where: { id }, include: withItems });
      if (!order) return null;
      if (order.status === "cancelled" || order.paymentStatus === "paid") return toOrder(order);

      for (const item of order.items) {
        if (!item.productSlug) continue; // product was deleted since
        await tx.product.updateMany({ where: { slug: item.productSlug }, data: { stock: { increment: item.quantity } } });
      }
      const row = await tx.order.update({
        where: { id },
        data: { status: "cancelled", paymentStatus },
        include: withItems,
      });
      return toOrder(row);
    });
  },
};
