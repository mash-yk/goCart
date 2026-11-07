import { NextResponse, type NextRequest } from "next/server";
import { getStripe } from "@/lib/stripe";
import { orderService } from "@/lib/services/order.service";
import { cartService } from "@/lib/services/cart.service";
import type Stripe from "stripe";

export async function POST(request: NextRequest) {
  const stripe = getStripe();
  if (!stripe) {
    return NextResponse.json({ error: "Stripe not configured" }, { status: 400 });
  }

  const signature = request.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  const rawBody = await request.text();
  let event: Stripe.Event;

  try {
    if (webhookSecret && signature) {
      event = stripe.webhooks.constructEvent(rawBody, signature, webhookSecret);
    } else {
      event = JSON.parse(rawBody) as Stripe.Event;
    }
  } catch (err) {
    console.error("[stripe.webhook] Invalid signature or payload:", err);
    return NextResponse.json({ error: "Webhook signature verification failed" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const orderId = session.client_reference_id || session.metadata?.orderId;
    const ownerId = session.metadata?.ownerId;

    if (orderId) {
      try {
        await orderService.verifyAndCompleteStripeOrder(orderId, session.id);
        if (ownerId) {
          await cartService.clear({ id: ownerId, kind: ownerId.startsWith("guest-") ? "guest" : "user" });
        }
      } catch (err) {
        console.error("[stripe.webhook] Failed to finalize order:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}

