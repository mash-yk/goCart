"use client";

import { useState } from "react";
import { ShoppingBag, Trash2 } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";

/** Wishlist actions: move the item to the cart (and out of the wishlist), or remove it. */
export function WishlistActions({ productSlug, productName, outOfStock }: { productSlug: string; productName: string; outOfStock: boolean }) {
  const { addToCart, toggleWishlist } = useStore();
  const [busy, setBusy] = useState<"move" | "remove" | null>(null);

  return (
    <div className="relative z-10 mt-3 flex gap-2">
      <Button
        size="sm"
        className="flex-1"
        disabled={outOfStock || busy !== null}
        loading={busy === "move"}
        onClick={async () => {
          setBusy("move");
          if (await addToCart(productSlug, 1, productName)) await toggleWishlist(productSlug, productName);
          setBusy(null);
        }}
      >
        {!busy && <ShoppingBag className="h-4 w-4" />}
        {outOfStock ? "Sold out" : "Move to cart"}
      </Button>
      <Button
        size="sm"
        variant="outline"
        className="w-9 px-0"
        aria-label={`Remove ${productName} from wishlist`}
        loading={busy === "remove"}
        disabled={busy !== null}
        onClick={async () => {
          setBusy("remove");
          await toggleWishlist(productSlug, productName);
          setBusy(null);
        }}
      >
        {busy !== "remove" && <Trash2 className="h-4 w-4" />}
      </Button>
    </div>
  );
}
