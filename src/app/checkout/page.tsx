import type { Metadata } from "next";
import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { CheckoutForm } from "@/components/checkout/checkout-form";
import { buttonClasses } from "@/components/ui/button";
import { getOwner } from "@/lib/auth/session";
import { cartService } from "@/lib/services/cart.service";

export const metadata: Metadata = {
  title: "Checkout | Lumora",
  robots: { index: false },
};

export const dynamic = "force-dynamic";

export default async function CheckoutPage() {
  const owner = await getOwner();
  const cart = owner ? await cartService.getCart(owner) : null;

  if (!cart || cart.lines.length === 0) {
    return (
      <div className="container max-w-xl py-16 text-center">
        <div className="mx-auto grid h-20 w-20 place-items-center rounded-3xl bg-brand-violet/10 text-brand-violet">
          <ShoppingBag className="h-10 w-10" />
        </div>
        <h1 className="mt-6 text-3xl font-black text-ink">Your cart is empty</h1>
        <p className="mt-2 text-sm text-ink-500">
          Looks like you haven&apos;t added any products to your cart yet. Explore our collections and find something you love.
        </p>
        <div className="mt-8">
          <Link href="/products" className={buttonClasses("primary", "lg")}>
            Start Shopping
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container py-8 sm:py-12">
      <div className="mb-8">
        <h1 className="text-3xl font-black tracking-tight sm:text-4xl text-ink">
          Secure <span className="text-gradient">Checkout</span>
        </h1>
        <p className="mt-1 text-sm text-ink-500">Complete your shipping and payment details below.</p>
      </div>

      <CheckoutForm cart={cart} />
    </div>
  );
}

