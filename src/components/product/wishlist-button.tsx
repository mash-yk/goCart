"use client";

import { useState } from "react";
import { Heart } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils/cn";

export function WishlistButton({
  productSlug,
  productName,
  className,
  variant = "floating",
}: {
  productSlug: string;
  productName: string;
  className?: string;
  variant?: "floating" | "outline";
}) {
  const { isWishlisted, toggleWishlist } = useStore();
  const [busy, setBusy] = useState(false);
  const saved = isWishlisted(productSlug);

  return (
    <button
      type="button"
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (busy) return;
        setBusy(true);
        await toggleWishlist(productSlug, productName);
        setBusy(false);
      }}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${productName} from wishlist` : `Save ${productName} to wishlist`}
      className={cn(
        "grid place-items-center rounded-full transition-all active:scale-90",
        variant === "floating" && "h-10 w-10 bg-white/85 shadow-card backdrop-blur hover:bg-white",
        variant === "outline" && "h-14 w-14 border border-ink-200 bg-white hover:border-fuchsia-400",
        className,
      )}
    >
      <Heart
        className={cn(
          "h-5 w-5 transition-colors",
          saved ? "animate-pop fill-fuchsia-500 text-fuchsia-500" : "text-ink-500",
        )}
      />
    </button>
  );
}
