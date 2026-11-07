import Stripe from "stripe";
import type { Order } from "@/types";

let stripeClient: Stripe | null = null;

export function getStripe(): Stripe | null {
  const secretKey = process.env.STRIPE_SECRET_KEY;
  if (!secretKey) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(secretKey);
  }
  return stripeClient;
}

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY);
}

export async function createStripeCheckoutSession({
  order,
  origin,
}: {
  order: Order;
  origin: string;
}): Promise<{ sessionId: string; url: string }> {
  const stripe = getStripe();
  if (!stripe) {
    throw new Error(
      "Stripe is not configured. Please set STRIPE_SECRET_KEY in your .env.local file.",
    );
  }

  const lineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = order.items.map((item) => ({
    price_data: {
      currency: "usd",
      product_data: {
        name: item.name,
      },
      unit_amount: item.price,
    },
    quantity: item.quantity,
  }));

  if (order.shipping > 0) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Standard Shipping",
        },
        unit_amount: order.shipping,
      },
      quantity: 1,
    });
  }

  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    line_items: lineItems,
    customer_email: order.customer.email,
    client_reference_id: order.id,
    metadata: {
      orderId: order.id,
      ownerId: order.ownerId,
    },
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}&order_id=${order.id}`,
    cancel_url: `${origin}/checkout?cancelled=1`,
  });

  if (!session.url) {
    throw new Error("Failed to create Stripe Checkout URL.");
  }

  return { sessionId: session.id, url: session.url };
}

