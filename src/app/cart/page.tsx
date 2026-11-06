import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { getOwner } from "@/lib/auth/session";
import { cartService } from "@/lib/services/cart.service";

export const metadata: Metadata = { title: "Your cart", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function CartPage() {
  const cart = await cartService.getCart(await getOwner());
  return (
    <div className="container py-8 sm:py-12">
      <h1 className="mb-8 text-4xl font-black tracking-tight sm:text-5xl">
        Your <span className="text-gradient">cart</span>
      </h1>
      <CartView initialCart={cart} />
    </div>
  );
}
