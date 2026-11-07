"use client";

import { useState } from "react";
import { Check, Loader2, Plus } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { cn } from "@/lib/utils/cn";

/** Small "+" button on product cards that adds one unit to the cart. */
export function QuickAddButton({
  productSlug,
  productName,
  disabled,
}: {
  productSlug: string;
  productName: string;
  disabled?: boolean;
}) {
  const { addToCart } = useStore();
  const [state, setState] = useState<"idle" | "loading" | "done">("idle");

  return (
    <button
      type="button"
      disabled={disabled || state === "loading"}
      onClick={async (e) => {
        e.preventDefault();
        e.stopPropagation();
        setState("loading");
        const ok = await addToCart(productSlug, 1, productName);
        setState(ok ? "done" : "idle");
        if (ok) setTimeout(() => setState("idle"), 1600);
      }}
      aria-label={disabled ? `${productName} is out of stock` : `Add ${productName} to cart`}
      className={cn(
        "grid h-10 w-10 shrink-0 place-items-center rounded-full transition-all duration-300 active:scale-90 disabled:cursor-not-allowed disabled:bg-ink-200 shadow-sm",
        state === "done" ? "bg-emerald-500 text-white" : "bg-[#1E1E1E] text-white hover:bg-[#FDC841] hover:text-[#181715] hover:shadow-glow",
      )}
    >
      {state === "loading" ? (
        <Loader2 className="h-4 w-4 animate-spin" />
      ) : state === "done" ? (
        <Check className="h-4 w-4" />
      ) : (
        <Plus className="h-4 w-4" />
      )}
    </button>
  );
}
