"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Calendar,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Mail,
  MapPin,
  Package,
  Phone,
  ShoppingBag,
} from "lucide-react";
import { ProductArt } from "@/components/art/product-art";
import { useStore } from "@/components/providers/store-provider";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { apiFetch } from "@/lib/client/api";
import { formatPrice } from "@/lib/utils/format";
import type { Order } from "@/types";

export function CheckoutSuccessView({
  order: initialOrder,
  sessionId,
}: {
  order: Order;
  sessionId?: string;
}) {
  const [order, setOrder] = useState<Order>(initialOrder);
  const { setCartCount } = useStore();

  useEffect(() => {
    // When landing with a Stripe sessionId, verify and clear cart in store state
    if (sessionId && order.paymentMethod === "stripe") {
      apiFetch<{ order: Order }>("/api/checkout/verify", {
        method: "POST",
        json: { orderId: order.id, sessionId },
      })
        .then((res) => {
          setOrder(res.order);
          setCartCount(0);
        })
        .catch((err) => console.error("Could not verify session:", err));
    } else {
      setCartCount(0);
    }
  }, [sessionId, order.id, order.paymentMethod, setCartCount]);

  const isCod = order.paymentMethod === "cod";
  const isPaid = order.paymentStatus === "paid";

  return (
    <div className="mx-auto max-w-3xl space-y-8">
      {/* Success Hero Header */}
      <div className="card overflow-hidden p-8 text-center sm:p-10 relative">
        <div className="absolute inset-x-0 top-0 h-2 bg-brand-gradient" aria-hidden />

        <div className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-emerald-100 text-emerald-600 shadow-sm">
          <CheckCircle2 className="h-9 w-9" />
        </div>

        <h1 className="mt-5 text-3xl font-black text-ink sm:text-4xl">
          Thank you for your order!
        </h1>
        <p className="mt-2 text-sm text-ink-500">
          We&apos;ve received your order and our fulfillment team is preparing your package.
        </p>

        <div className="mt-6 inline-flex flex-wrap items-center justify-center gap-3 rounded-2xl bg-ink-50 px-4 py-2 text-xs font-semibold text-ink-700">
          <span>Order ID: <strong className="font-mono text-ink">{order.id}</strong></span>
          <span className="text-ink-300">•</span>
          <span>Date: {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
          <span className="text-ink-300">•</span>
          <Badge tone={isPaid ? "success" : isCod ? "warning" : "neutral"}>
            {isPaid ? "Paid in Full" : isCod ? "COD: Pay on Arrival" : "Payment Pending"}
          </Badge>
        </div>
      </div>

      {/* Order Status & Delivery Info */}
      <div className="grid gap-6 sm:grid-cols-2">
        <div className="card p-6">
          <div className="flex items-center gap-2.5 font-bold text-ink">
            <Package className="h-5 w-5 text-[#855000]" />
            <h3>Delivery Details</h3>
          </div>
          <div className="mt-4 space-y-2.5 text-xs text-ink-600">
            <div className="flex items-start gap-2">
              <MapPin className="h-4 w-4 shrink-0 text-ink-400 mt-0.5" />
              <div>
                <p className="font-semibold text-ink">{order.customer.name}</p>
                <p>{order.shippingAddress.addressLine1}</p>
                {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                <p>
                  {order.shippingAddress.city}, {order.shippingAddress.state} {order.shippingAddress.postalCode}
                </p>
                <p>{order.shippingAddress.country}</p>
              </div>
            </div>
            <div className="flex items-center gap-2 pt-1 border-t border-ink-100">
              <Mail className="h-4 w-4 shrink-0 text-ink-400" />
              <span>{order.customer.email}</span>
            </div>
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 shrink-0 text-ink-400" />
              <span>{order.customer.phone}</span>
            </div>
          </div>
        </div>

        <div className="card p-6">
          <div className="flex items-center gap-2.5 font-bold text-ink">
            {isCod ? <DollarSign className="h-5 w-5 text-emerald-600" /> : <CreditCard className="h-5 w-5 text-[#855000]" />}
            <h3>Payment Method</h3>
          </div>
          <div className="mt-4 space-y-3 text-xs text-ink-600">
            {isCod ? (
              <div className="rounded-xl bg-emerald-50/70 p-3.5 border border-emerald-100">
                <p className="font-bold text-emerald-900">Cash on Delivery (COD)</p>
                <p className="mt-1 text-emerald-800">
                  Please keep exact cash ready ({formatPrice(order.total)}) when the courier arrives at your doorstep.
                </p>
              </div>
            ) : (
              <div className="rounded-xl bg-[#FEF9EC] p-3.5 border border-[#FDE1A3]">
                <p className="font-bold text-[#855000]">Card Payment (Stripe)</p>
                <p className="mt-1 text-[#855000]">
                  Payment has been processed securely. A payment receipt has been dispatched to {order.customer.email}.
                </p>
              </div>
            )}
            <div className="flex items-center gap-2 text-ink-500 pt-1">
              <Calendar className="h-4 w-4 shrink-0 text-ink-400" />
              <span>Estimated Delivery: 3 to 5 business days</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Summary Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 bg-ink-50 p-5 font-bold text-ink flex justify-between items-center">
          <span>Items Ordered ({order.itemCount})</span>
          <span className="text-xs text-ink-500 font-normal">All items guaranteed authentic</span>
        </div>

        <div className="divide-y divide-ink-100 p-5">
          {order.items.map((item) => (
            <div key={item.slug} className="flex items-center justify-between py-3.5 first:pt-0 last:pb-0">
              <div className="flex items-center gap-3">
                {item.art && (
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-ink-100">
                    <ProductArt art={item.art} name={item.name} />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-sm text-ink">{item.name}</p>
                  <p className="text-xs text-ink-500">
                    Qty: {item.quantity} × {formatPrice(item.price)}
                  </p>
                </div>
              </div>
              <p className="font-bold text-sm text-ink">{formatPrice(item.lineTotal)}</p>
            </div>
          ))}
        </div>

        {/* Totals */}
        <div className="border-t border-ink-100 bg-ink-50/50 p-5">
          <dl className="space-y-2 text-xs">
            <div className="flex justify-between">
              <dt className="text-ink-500">Subtotal</dt>
              <dd className="font-semibold text-ink">{formatPrice(order.subtotal)}</dd>
            </div>
            {order.savings > 0 && (
              <div className="flex justify-between text-[#D97706]">
                <dt>Sale savings (included)</dt>
                <dd className="font-semibold">{formatPrice(order.savings)}</dd>
              </div>
            )}
            <div className="flex justify-between">
              <dt className="text-ink-500">Shipping</dt>
              <dd className="font-semibold text-ink">
                {order.shipping === 0 ? "Free" : formatPrice(order.shipping)}
              </dd>
            </div>
            <div className="flex items-baseline justify-between border-t border-ink-200 pt-2 text-sm">
              <dt className="font-black text-ink">Total</dt>
              <dd className="text-xl font-black text-ink">{formatPrice(order.total)}</dd>
            </div>
          </dl>
        </div>
      </div>

      {/* Action Footer */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4">
        <Link href="/products" className={buttonClasses("primary", "lg", "w-full sm:w-auto")}>
          <ShoppingBag className="h-4 w-4" /> Continue Shopping
        </Link>
        <Link href="/account" className={buttonClasses("outline", "lg", "w-full sm:w-auto")}>
          Go to My Account <ArrowRight className="h-4 w-4" />
        </Link>
      </div>
    </div>
  );
}

