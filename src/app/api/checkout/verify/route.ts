import { z } from "zod";
import { json, readJson, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { orderService } from "@/lib/services/order.service";
import { parseInput } from "@/lib/validation/parse";

const verifySchema = z.object({
  orderId: z.string().min(1).max(64),
  sessionId: z.string().min(1).max(255).optional(),
});

/** Re-checks a card payment with Stripe after the buyer returns from Stripe Checkout. */
export const POST = route(async (request) => {
  const { orderId, sessionId } = parseInput(verifySchema, await readJson(request));
  const order = await orderService.getOrderFor(orderId, await getOwner());
  const updated = sessionId ? await orderService.confirmStripePayment(order, sessionId) : order;
  return json({ order: updated });
});
