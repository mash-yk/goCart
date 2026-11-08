import { json, route } from "@/lib/api/handler";
import { getOwner } from "@/lib/auth/session";
import { orderService } from "@/lib/services/order.service";

type Params = { id: string };

/** An order is only visible to whoever placed it, or to an admin. */
export const GET = route<Params>(async (_request, { params }) => {
  const { id } = await params;
  const order = await orderService.getOrderFor(id, await getOwner());
  return json({ order });
});
