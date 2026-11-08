import "server-only";
import { getCurrentUser } from "@/lib/auth/session";
import { orderRepository } from "@/lib/db/repositories/order.repository";
import { cartService } from "@/lib/services/cart.service";
import { createStripeCheckoutSession, getStripe, isStripeConfigured } from "@/lib/stripe";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import type { CheckoutInput } from "@/lib/validation/schemas";
import type { Order, OrderItem, Owner } from "@/types";

function newOrderId(): string {
  return `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 16)}`;
}

export const orderService = {
  /**
   * Places an order from the owner's current cart.
   * - Cash on delivery: stock is reserved, the order is saved and the cart emptied, all in one transaction.
   * - Stripe: stock is reserved and the order saved as "pending payment", then the buyer is sent to
   *   Stripe Checkout. The cart is emptied once Stripe confirms the payment.
   */
  async createOrder(owner: Owner, input: CheckoutInput, origin: string): Promise<{ order: Order; redirectUrl: string }> {
    if (input.paymentMethod === "stripe" && !isStripeConfigured()) {
      throw new BadRequestError("Card payments aren't set up on this store yet. Please choose cash on delivery.");
    }

    const cart = await cartService.getCart(owner);
    const purchasable = cart.lines.filter((line) => line.maxQuantity > 0);
    if (purchasable.length === 0 || cart.total === 0) {
      throw new BadRequestError("Your cart is empty. Add products before checking out.");
    }

    const items: OrderItem[] = purchasable.map((line) => ({
      slug: line.product.slug,
      name: line.product.name,
      price: line.product.price,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      art: line.product.art,
    }));

    const order = await orderRepository.create(
      owner,
      {
        id: newOrderId(),
        customer: input.customer,
        shippingAddress: input.shippingAddress,
        items,
        itemCount: cart.itemCount,
        subtotal: cart.subtotal,
        shipping: cart.shipping,
        savings: cart.savings,
        total: cart.total,
        paymentMethod: input.paymentMethod,
        paymentStatus: input.paymentMethod === "cod" ? "pending_cod" : "pending_payment",
      },
      { clearCart: input.paymentMethod === "cod" },
    );

    if (input.paymentMethod === "cod") {
      return { order, redirectUrl: `${origin}/checkout/success?order_id=${order.id}` };
    }

    try {
      const session = await createStripeCheckoutSession({ order, origin });
      await orderRepository.setStripeSession(order.id, session.sessionId);
      return { order: { ...order, stripeSessionId: session.sessionId }, redirectUrl: session.url };
    } catch (error) {
      // Couldn't reach Stripe: release the reserved stock so it isn't stuck.
      await orderRepository.cancelUnpaid(order.id);
      console.error("[checkout] failed to create Stripe session", error);
      throw new BadRequestError("We couldn't start the card payment. Please try again or choose cash on delivery.");
    }
  },

  /**
   * Returns an order only to the person who placed it (same account or same guest
   * browser) or to an admin. Anyone else gets a 404, so order ids can't be probed.
   */
  async getOrderFor(id: string, owner: Owner | null): Promise<Order> {
    const order = await orderRepository.getById(id);
    if (!order) throw new NotFoundError("Order");
    if (owner && order.ownerId === owner.id) return order;
    const user = await getCurrentUser();
    if (user?.role === "admin") return order;
    throw new NotFoundError("Order");
  },

  listOwnerOrders(owner: Owner): Promise<Order[]> {
    return orderRepository.listByOwner(owner);
  },

  /**
   * Confirms a card payment by asking Stripe directly, never trusting the browser.
   * Used by the success page; the webhook does the same from Stripe's side.
   */
  async confirmStripePayment(order: Order, sessionId: string): Promise<Order> {
    if (order.paymentMethod !== "stripe" || order.paymentStatus === "paid") return order;
    const stripe = getStripe();
    if (!stripe) return order;

    const session = await stripe.checkout.sessions.retrieve(sessionId);
    if (session.client_reference_id !== order.id) {
      throw new BadRequestError("This payment doesn't belong to this order.");
    }
    if (session.payment_status === "paid") {
      return (await orderRepository.markPaid(order.id, session.id)) ?? order;
    }
    return order;
  },

  /** The buyer came back from Stripe without paying: cancel their pending order and restock. */
  async cancelAbandonedCheckout(orderId: string, owner: Owner): Promise<void> {
    const order = await orderRepository.getById(orderId);
    if (order && order.ownerId === owner.id && order.paymentStatus === "pending_payment") {
      await orderRepository.cancelUnpaid(order.id, "failed");
    }
  },

  /** Called by the Stripe webhook after Stripe has verified the event signature. */
  async handleStripeSessionCompleted(orderId: string, sessionId: string, paid: boolean): Promise<void> {
    if (paid) await orderRepository.markPaid(orderId, sessionId);
  },

  /** Called by the Stripe webhook when an unpaid checkout session expires. */
  async handleStripeSessionExpired(orderId: string): Promise<void> {
    await orderRepository.cancelUnpaid(orderId, "failed");
  },
};
