import { json, route } from "@/lib/api/handler";
import { orderService } from "@/lib/services/order.service";

type Params = { id: string };

export const GET = route<Params>(async (_request, { params }) => {
  const { id } = await params;
  const order = await orderService.getOrder(id);
  return json({ order });
});

