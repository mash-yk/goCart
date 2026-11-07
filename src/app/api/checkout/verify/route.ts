import { json, readJson, route } from "@/lib/api/handler";
import { getStripe } from "@/lib/stripe";
import { orderService } from "@/lib/services/order.service";
import { cartService } from "@/lib/services/cart.service";
import { getOwner } from "@/lib/auth/session";

export const POST = route(async (request) => {
  const body = (await readJson(request)) as { orderId?: string; sessionId?: string };
  const { orderId, sessionId } = body;

  if (!orderId) {
    return json({ error: "Missing orderId" }, { status: 400 });
  }

  const order = await orderService.getOrder(orderId);

  // If a Stripe session id was provided, verify with Stripe
  if (sessionId && order.paymentMethod === "stripe") {
    const stripe = getStripe();
    if (stripe) {
      try {
        const session = await stripe.checkout.sessions.retrieve(sessionId);
        if (session.payment_status === "paid") {
          await orderService.verifyAndCompleteStripeOrder(orderId, sessionId);
          const owner = await getOwner();
          if (owner) {
            await cartService.clear(owner);
          }
        }
      } catch (err) {
        console.error("[checkout.verify] failed to retrieve stripe session", err);
      }
    }
  }

  const updatedOrder = await orderService.getOrder(orderId);
  return json({ order: updatedOrder });
});

