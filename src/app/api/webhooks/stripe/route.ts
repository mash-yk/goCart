import { NextResponse, type NextRequest } from "next/server";
import type Stripe from "stripe";
import { getConfig } from "@/lib/config";
import { orderService } from "@/lib/services/order.service";
import { getStripe } from "@/lib/stripe";

export const dynamic = "force-dynamic";

/**
 * Stripe webhook. Every event's signature is verified with STRIPE_WEBHOOK_SECRET,
 * so nobody can fake a "payment completed" message.
 */
export async function POST(request: NextRequest) {
  const stripe = getStripe();
  const { webhookSecret } = getConfig().stripe;
  if (!stripe || !webhookSecret) {
    return NextResponse.json({ error: "Stripe webhooks are not configured." }, { status: 503 });
  }

  const signature = request.headers.get("stripe-signature");
  if (!signature) return NextResponse.json({ error: "Missing Stripe signature." }, { status: 400 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, webhookSecret);
  } catch (error) {
    console.error("[stripe.webhook] signature verification failed", error);
    return NextResponse.json({ error: "Invalid signature." }, { status: 400 });
  }

  const session = event.data.object as Stripe.Checkout.Session;
  const orderId = session.client_reference_id ?? session.metadata?.orderId;

  try {
    if (orderId && event.type === "checkout.session.completed") {
      await orderService.handleStripeSessionCompleted(orderId, session.id, session.payment_status === "paid");
    } else if (orderId && event.type === "checkout.session.async_payment_succeeded") {
      await orderService.handleStripeSessionCompleted(orderId, session.id, true);
    } else if (orderId && event.type === "checkout.session.expired") {
      await orderService.handleStripeSessionExpired(orderId);
    }
  } catch (error) {
    console.error(`[stripe.webhook] failed to handle ${event.type}`, error);
    // A 500 makes Stripe retry the event later.
    return NextResponse.json({ error: "Failed to process event." }, { status: 500 });
  }

  return NextResponse.json({ received: true });
}
