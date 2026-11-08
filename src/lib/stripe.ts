import "server-only";
import Stripe from "stripe";
import { getConfig } from "@/lib/config";
import type { Order } from "@/types";

let stripeClient: Stripe | null = null;

/** The Stripe client, or null when STRIPE_SECRET_KEY isn't set (cash on delivery still works). */
export function getStripe(): Stripe | null {
  const { secretKey } = getConfig().stripe;
  if (!secretKey) return null;
  stripeClient ??= new Stripe(secretKey);
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(getConfig().stripe.secretKey);
}

/** Creates a hosted Stripe Checkout page for an order. Amounts are already in cents. */
export async function createStripeCheckoutSession({
  order,
  origin,
}: {
  order: Order;
  origin: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  if (!stripe) throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY.");

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
    price_data: { currency: "usd", product_data: { name: item.name }, unit_amount: item.price },
    quantity: item.quantity,
  }));
  if (order.shipping > 0) {
    lineItems.push({
      price_data: { currency: "usd", product_data: { name: "Standard shipping" }, unit_amount: order.shipping },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: order.customer.email,
    client_reference_id: order.id,
    metadata: { orderId: order.id },
    // Unpaid sessions expire after 30 minutes; the webhook then releases the reserved stock.
    expires_at: Math.floor(Date.now() / 1000) + 30 * 60,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: `${origin}/checkout?cancelled=1&order_id=${order.id}`,
  });

  if (!session.url) throw new Error("Stripe did not return a checkout URL.");
  return { sessionId: session.id, url: session.url };
}
