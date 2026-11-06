"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowRight, Lock, ShoppingBag, Sparkles, Trash2, Truck } from "lucide-react";
import { toast } from "sonner";
import { ProductArt } from "@/components/art/product-art";
import { useStore } from "@/components/providers/store-provider";
import { Button, buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { FREE_SHIPPING_THRESHOLD } from "@/lib/business/pricing";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";
import { formatPrice, pluralize } from "@/lib/utils/format";
import type { Cart, CartLine } from "@/types";

function Line({ line, busy, onQuantity, onRemove }: {
  line: CartLine;
  busy: boolean;
  onQuantity: (q: number) => void;
  onRemove: () => void;
}) {
  const { product, quantity, lineTotal, maxQuantity } = line;
  const unavailable = maxQuantity === 0;

  return (
    <li className={cn("flex gap-4 py-5 transition-opacity sm:gap-6", busy && "opacity-60")}>
      <Link href={`/products/${product.slug}`} className="w-24 shrink-0 overflow-hidden rounded-2xl sm:w-32">
        <ProductArt art={product.art} name={product.name} image={product.images[0]} sizes="128px" />
      </Link>
      <div className="flex min-w-0 flex-1 flex-col">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <Link href={`/products/${product.slug}`} className="line-clamp-2 font-bold hover:text-brand-violet">
              {product.name}
            </Link>
            <p className="mt-0.5 line-clamp-1 text-sm text-ink-500">{product.tagline}</p>
          </div>
          <p className="shrink-0 font-bold">{formatPrice(lineTotal)}</p>
        </div>
        <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="mt-1 [&>span:first-child]:text-sm [&>span:first-child]:font-semibold" />
        {unavailable && (
          <p className="mt-2 inline-flex items-center gap-1.5 text-sm font-semibold text-rose-600">
            <AlertTriangle className="h-4 w-4" /> Sold out, not included in your total
          </p>
        )}
        <div className="mt-auto flex items-center justify-between gap-3 pt-3">
          {unavailable ? (
            <span />
          ) : (
            <QuantityStepper size="sm" value={quantity} max={maxQuantity} min={1} onChange={onQuantity} disabled={busy} label={`Quantity for ${product.name}`} />
          )}
          <button
            type="button"
            onClick={onRemove}
            disabled={busy}
            className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-semibold text-ink-500 transition hover:bg-rose-50 hover:text-rose-600"
            aria-label={`Remove ${product.name} from cart`}
          >
            <Trash2 className="h-4 w-4" /> <span className="hidden sm:inline">Remove</span>
          </button>
        </div>
      </div>
    </li>
  );
}

export function CartView({ initialCart }: { initialCart: Cart }) {
  const router = useRouter();
  const { setCartCount } = useStore();
  const [cart, setCart] = useState(initialCart);
  const [busy, setBusy] = useState<Set<string>>(new Set());
  const [clearing, setClearing] = useState(false);

  function apply(next: Cart) {
    setCart(next);
    setCartCount(next.itemCount);
  }

  async function mutate(slug: string, request: () => Promise<{ cart: Cart }>, success?: string) {
    setBusy((b) => new Set(b).add(slug));
    try {
      const { cart: next } = await request();
      apply(next);
      if (success) toast.success(success);
    } catch (error) {
      toast.error(errorMessage(error));
      router.refresh();
    } finally {
      setBusy((b) => {
        const n = new Set(b);
        n.delete(slug);
        return n;
      });
    }
  }

  async function clearCart() {
    setClearing(true);
    try {
      await apiFetch("/api/cart", { method: "DELETE" });
      apply({ ...cart, lines: [], itemCount: 0, subtotal: 0, savings: 0, shipping: 0, total: 0, freeShippingRemaining: 0 });
      toast.success("Your cart is empty");
    } catch (error) {
      toast.error(errorMessage(error));
    } finally {
      setClearing(false);
    }
  }

  if (cart.lines.length === 0) {
    return (
      <EmptyState
        icon={<ShoppingBag className="h-9 w-9" />}
        title="Your cart is feeling light"
        description="Nothing here yet. Explore the collection and add something that sparks joy."
        action={
          <>
            <Link href="/products" className={buttonClasses("primary")}>
              Start shopping <ArrowRight className="h-4 w-4" />
            </Link>
            <Link href="/wishlist" className={buttonClasses("outline")}>
              View wishlist
            </Link>
          </>
        }
      />
    );
  }

  const progress = Math.min(100, ((FREE_SHIPPING_THRESHOLD - cart.freeShippingRemaining) / FREE_SHIPPING_THRESHOLD) * 100);

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
      <section aria-label="Cart items" className="card px-5 sm:px-8">
        <div className="flex items-center justify-between border-b border-ink-100 py-5">
          <h2 className="font-bold">{pluralize(cart.itemCount, "item")}</h2>
          <button
            type="button"
            onClick={clearCart}
            disabled={clearing}
            className="text-sm font-semibold text-ink-400 underline-offset-4 hover:text-rose-600 hover:underline disabled:opacity-50"
          >
            Clear cart
          </button>
        </div>
        <ul className="divide-y divide-ink-100">
          {cart.lines.map((line) => (
            <Line
              key={line.product.slug}
              line={line}
              busy={busy.has(line.product.slug) || clearing}
              onQuantity={(quantity) => {
                // Optimistic: show the new quantity right away; the server response is the source of truth.
                setCart((c) => ({ ...c, lines: c.lines.map((l) => (l.product.slug === line.product.slug ? { ...l, quantity, lineTotal: l.product.price * quantity } : l)) }));
                void mutate(line.product.slug, () =>
                  apiFetch(`/api/cart/${line.product.slug}`, { method: "PATCH", json: { quantity } }),
                );
              }}
              onRemove={() =>
                mutate(
                  line.product.slug,
                  () => apiFetch(`/api/cart/${line.product.slug}`, { method: "DELETE" }),
                  `${line.product.name} removed`,
                )
              }
            />
          ))}
        </ul>
      </section>

      <aside className="lg:sticky lg:top-28 lg:self-start">
        <div className="card overflow-hidden">
          <div className="bg-brand-gradient-soft p-5">
            {cart.freeShippingRemaining > 0 ? (
              <p className="flex items-center gap-2 text-sm font-semibold">
                <Truck className="h-4 w-4 text-brand-violet" />
                Add <span className="text-brand-violet">{formatPrice(cart.freeShippingRemaining)}</span> more for free shipping
              </p>
            ) : (
              <p className="flex items-center gap-2 text-sm font-semibold text-emerald-700">
                <Sparkles className="h-4 w-4" /> You&apos;ve unlocked free shipping!
              </p>
            )}
            <div className="mt-3 h-2 overflow-hidden rounded-full bg-white" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Progress to free shipping">
              <div className="h-full rounded-full bg-brand-gradient transition-all duration-700" style={{ width: `${progress}%` }} />
            </div>
          </div>
          <div className="p-6">
            <h2 className="text-lg font-extrabold">Order summary</h2>
            <dl className="mt-4 space-y-3 text-sm">
              <div className="flex justify-between">
                <dt className="text-ink-500">Subtotal</dt>
                <dd className="font-semibold">{formatPrice(cart.subtotal)}</dd>
              </div>
              {cart.savings > 0 && (
                <div className="flex justify-between text-fuchsia-700">
                  <dt>You save</dt>
                  <dd className="font-semibold">−{formatPrice(cart.savings)}</dd>
                </div>
              )}
              <div className="flex justify-between">
                <dt className="text-ink-500">Shipping</dt>
                <dd className="font-semibold">{cart.shipping === 0 ? "Free" : formatPrice(cart.shipping)}</dd>
              </div>
              <div className="flex justify-between">
                <dt className="text-ink-500">Tax</dt>
                <dd className="text-ink-400">Calculated at checkout</dd>
              </div>
              <div className="flex items-baseline justify-between border-t border-ink-100 pt-4">
                <dt className="font-bold">Total</dt>
                <dd className="text-2xl font-black">{formatPrice(cart.total)}</dd>
              </div>
            </dl>
            <Button
              size="lg"
              className="mt-6 w-full"
              disabled={cart.total === 0}
              onClick={() => toast.info("Checkout is coming soon. Payments aren't enabled in this demo store.")}
            >
              <Lock className="h-4 w-4" /> Checkout
            </Button>
            <Link href="/products" className="mt-3 block text-center text-sm font-semibold text-ink-500 hover:text-brand-violet">
              Continue shopping
            </Link>
          </div>
        </div>
      </aside>
    </div>
  );
}
