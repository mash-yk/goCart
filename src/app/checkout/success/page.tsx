import type { Metadata } from "next";
import Link from "next/link";
import { AlertCircle } from "lucide-react";
import { CheckoutSuccessView } from "@/components/checkout/checkout-success-view";
import { buttonClasses } from "@/components/ui/button";
import { getOwner } from "@/lib/auth/session";
import { orderService } from "@/lib/services/order.service";
import type { Order } from "@/types";

export const metadata: Metadata = {
  title: "Order confirmed",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

interface SuccessPageProps {
  searchParams: Promise<{
    order_id?: string;
    session_id?: string;
    method?: string;
  }>;
}

export default async function CheckoutSuccessPage({ searchParams }: SuccessPageProps) {
  const { order_id, session_id } = await searchParams;

  if (!order_id) {
    return (
      <div className="container max-w-lg py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-ink">Order Not Found</h1>
        <p className="mt-2 text-sm text-ink-500">
          We couldn&apos;t locate the order details you were looking for.
        </p>
        <div className="mt-6">
          <Link href="/products" className={buttonClasses("primary", "md")}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  let order: Order;
  try {
    // Only the person who placed the order (or an admin) can see it.
    order = await orderService.getOrderFor(order_id, await getOwner());
  } catch {
    return (
      <div className="container max-w-lg py-16 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-amber-100 text-amber-600">
          <AlertCircle className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-ink">Order Not Found</h1>
        <p className="mt-2 text-sm text-ink-500">
          No order was found with ID <strong className="font-mono text-ink">{order_id}</strong>.
        </p>
        <div className="mt-6">
          <Link href="/products" className={buttonClasses("primary", "md")}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (session_id) {
    // Back from Stripe: confirm the payment with Stripe's API before showing it as paid.
    order = await orderService.confirmStripePayment(order, session_id).catch(() => order);
  }

  return (
    <div className="container py-8 sm:py-12">
      <CheckoutSuccessView order={order} sessionId={session_id} />
    </div>
  );
}

