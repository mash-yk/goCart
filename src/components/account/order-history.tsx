import Link from "next/link";
import { Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { formatPrice, pluralize } from "@/lib/utils/format";
import type { Order } from "@/types";

type Tone = "success" | "warning" | "neutral" | "danger";

const STATUS_LABEL: Record<Order["paymentStatus"], { label: string; tone: Tone }> = {
  paid: { label: "Paid", tone: "success" },
  pending_cod: { label: "Cash on delivery", tone: "warning" },
  pending_payment: { label: "Awaiting payment", tone: "neutral" },
  failed: { label: "Payment failed", tone: "danger" },
};

/** The signed-in customer's past orders, newest first. */
export function OrderHistory({ orders }: { orders: Order[] }) {
  return (
    <section className="card mt-6 p-6 sm:p-8" aria-labelledby="orders-heading">
      <h2 id="orders-heading" className="flex items-center gap-2 text-xl font-extrabold">
        <Package className="h-5 w-5 text-[#855000]" /> Your orders
      </h2>
      {orders.length === 0 ? (
        <p className="mt-4 text-sm text-ink-500">
          No orders yet.{" "}
          <Link href="/products" className="font-semibold text-ink underline-offset-4 hover:underline">
            Start shopping
          </Link>
        </p>
      ) : (
        <ul className="mt-5 divide-y divide-ink-100">
          {orders.map((order) => {
            const status = order.status === "cancelled" ? { label: "Cancelled", tone: "danger" as const } : STATUS_LABEL[order.paymentStatus];
            return (
              <li key={order.id}>
                <Link
                  href={`/checkout/success?order_id=${order.id}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-4 transition hover:opacity-80"
                >
                  <div className="min-w-0">
                    <p className="font-mono text-sm font-semibold">{order.id}</p>
                    <p className="text-xs text-ink-500">
                      {new Date(order.createdAt).toLocaleDateString("en-US", { day: "numeric", month: "short", year: "numeric" })}
                      {" · "}
                      {pluralize(order.itemCount, "item")}
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge tone={status.tone}>{status.label}</Badge>
                    <span className="font-bold">{formatPrice(order.total)}</span>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
