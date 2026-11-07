import "server-only";
import { orderRepository } from "@/lib/db/repositories/order.repository";
import { cartService } from "@/lib/services/cart.service";
import { createStripeCheckoutSession, isStripeConfigured } from "@/lib/stripe";
import { BadRequestError, NotFoundError } from "@/lib/errors";
import type { CheckoutInput } from "@/lib/validation/schemas";
import type { Order, OrderItem, Owner } from "@/types";

export const orderService = {
  async createOrder(
    owner: Owner,
    input: CheckoutInput,
    origin: string,
  ): Promise<{ order: Order; redirectUrl: string }> {
    const cart = await cartService.getCart(owner);

    if (cart.lines.length === 0 || cart.total === 0) {
      throw new BadRequestError("Your cart is empty. Add products before checking out.");
    }

    const items: OrderItem[] = cart.lines.map((line) => ({
      slug: line.product.slug,
      name: line.product.name,
      price: line.product.price,
      quantity: line.quantity,
      lineTotal: line.lineTotal,
      art: line.product.art,
    }));

    const orderId = `ord_${crypto.randomUUID().replace(/-/g, "").slice(0, 12)}`;
    const now = new Date().toISOString();

    const order: Order = {
      id: orderId,
      ownerId: owner.id,
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
      status: "confirmed",
      createdAt: now,
      updatedAt: now,
    };

    await orderRepository.create(order);

    if (input.paymentMethod === "cod") {
      // For Cash On Delivery, order is confirmed immediately and cart is cleared
      await cartService.clear(owner);
      return {
        order,
        redirectUrl: `${origin}/checkout/success?order_id=${order.id}&method=cod`,
      };
    }

    // Stripe checkout flow
    if (!isStripeConfigured()) {
      throw new BadRequestError(
        "Stripe is not configured on the server. Please add STRIPE_SECRET_KEY to .env.local, or select Cash on Delivery (COD) to test orders.",
      );
    }

    const session = await createStripeCheckoutSession({ order, origin });
    await orderRepository.updateStatus(order.id, "confirmed", "pending_payment", session.sessionId);

    return {
      order,
      redirectUrl: session.url,
    };
  },

  async getOrder(id: string): Promise<Order> {
    const order = await orderRepository.getById(id);
    if (!order) {
      throw new NotFoundError("Order");
    }
    return order;
  },

  async listOwnerOrders(owner: Owner): Promise<Order[]> {
    return orderRepository.listByOwner(owner.id);
  },

  async verifyAndCompleteStripeOrder(orderId: string, sessionId?: string): Promise<Order> {
    const order = await this.getOrder(orderId);
    if (order.paymentStatus !== "paid") {
      const updated = await orderRepository.updateStatus(order.id, "confirmed", "paid", sessionId);
      if (updated) return updated;
    }
    return order;
  },
};

