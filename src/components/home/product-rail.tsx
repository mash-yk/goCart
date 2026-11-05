"use client";

import { useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import type { Product } from "@/types";

/** A horizontally scrolling row of products with arrow controls on larger screens. */
export function ProductRail({ products, label }: { products: Product[]; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const scroll = (dir: 1 | -1) => ref.current?.scrollBy({ left: dir * ref.current.clientWidth * 0.8, behavior: "smooth" });

  return (
    <div className="relative">
      <div
        ref={ref}
        role="region"
        aria-label={label}
        tabIndex={0}
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto scroll-px-4 px-4 pb-6 pt-2 sm:-mx-6 sm:gap-5 sm:px-6 lg:mx-0 lg:px-0"
      >
        {products.map((p) => (
          <ProductCard key={p.slug} product={p} className="w-[46%] shrink-0 snap-start sm:w-[31%] lg:w-[23.5%]" />
        ))}
      </div>
      <div className="pointer-events-none absolute -top-[4.5rem] right-0 hidden gap-2 lg:flex">
        {([-1, 1] as const).map((dir) => (
          <button
            key={dir}
            type="button"
            onClick={() => scroll(dir)}
            aria-label={dir < 0 ? "Scroll left" : "Scroll right"}
            className="pointer-events-auto grid h-11 w-11 place-items-center rounded-full border border-ink-200 bg-white transition hover:border-brand-violet hover:text-brand-violet"
          >
            {dir < 0 ? <ChevronLeft className="h-5 w-5" /> : <ChevronRight className="h-5 w-5" />}
          </button>
        ))}
      </div>
    </div>
  );
}
