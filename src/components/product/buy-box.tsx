"use client";

import { useState } from "react";
import Link from "next/link";
import { Check, ShoppingBag } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";
import { QuantityStepper } from "@/components/ui/quantity-stepper";
import { useStore } from "@/components/providers/store-provider";
import { maxAllowedQuantity } from "@/lib/business/pricing";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types";
import { WishlistButton } from "./wishlist-button";

export function BuyBox({ product }: { product: Product }) {
  const { addToCart } = useStore();
  const max = maxAllowedQuantity(product);
  const outOfStock = max === 0;
  const [quantity, setQuantity] = useState(1);
  const [color, setColor] = useState(product.colors[0]?.name);
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);

  async function onAdd() {
    setAdding(true);
    const ok = await addToCart(product.slug, quantity, product.name);
    setAdding(false);
    if (ok) {
      setAdded(true);
      setTimeout(() => setAdded(false), 2200);
    }
  }

  return (
    <div className="space-y-6">
      {product.colors.length > 0 && (
        <fieldset>
          <legend className="mb-3 text-sm font-semibold">
            Colour: <span className="font-normal text-ink-500">{color}</span>
          </legend>
          <div className="flex flex-wrap gap-3">
            {product.colors.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c.name)}
                aria-pressed={color === c.name}
                aria-label={c.name}
                title={c.name}
                className={cn(
                  "h-10 w-10 rounded-full border border-ink-200 ring-2 ring-offset-2 transition hover:scale-110",
                  color === c.name ? "ring-brand-violet" : "ring-transparent",
                )}
                style={{ backgroundColor: c.hex }}
              />
            ))}
          </div>
        </fieldset>
      )}

      <div className="flex items-center gap-2 sm:gap-3">
        {!outOfStock && <QuantityStepper value={quantity} max={max} onChange={setQuantity} />}
        <Button size="lg" className="min-w-0 flex-1 sm:min-w-[200px]" onClick={onAdd} loading={adding} disabled={outOfStock}>
          {outOfStock ? (
            "Sold out"
          ) : added ? (
            <>
              <Check className="h-5 w-5" /> Added!
            </>
          ) : (
            <>
              <ShoppingBag className="h-5 w-5" /> Add to cart
            </>
          )}
        </Button>
        <WishlistButton productSlug={product.slug} productName={product.name} variant="outline" />
      </div>

      {added && (
        <Link href="/cart" className={buttonClasses("dark", "md", "w-full animate-fade-up")}>
          Go to cart and check out
        </Link>
      )}
      {!outOfStock && product.stock > max && (
        <p className="text-xs text-ink-400">Limit {max} per order.</p>
      )}
    </div>
  );
}
