"use client";

import { useState } from "react";
import { ProductArt } from "@/components/art/product-art";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types";

const VIEWS = ["Front", "Detail", "Side", "Lifestyle"];

export function ProductGallery({ product }: { product: Product }) {
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const photos = product.images;
  const count = photos.length > 0 ? photos.length : VIEWS.length;

  return (
    <div className="flex flex-col-reverse gap-3 self-start sm:flex-row lg:sticky lg:top-28">
      <div className="no-scrollbar flex gap-3 overflow-x-auto sm:flex-col" role="tablist" aria-label="Product images">
        {Array.from({ length: count }).map((_, i) => (
          <button
            key={i}
            type="button"
            role="tab"
            aria-selected={active === i}
            aria-label={`Show image ${i + 1}: ${VIEWS[i] ?? "photo"}`}
            onClick={() => setActive(i)}
            className={cn(
              "w-20 shrink-0 overflow-hidden rounded-2xl ring-2 ring-offset-2 transition sm:w-24",
              active === i ? "ring-brand-violet" : "ring-transparent opacity-70 hover:opacity-100",
            )}
          >
            <ProductArt art={product.art} name="" image={photos[i]} variant={i} sizes="96px" iconClassName="h-[40%] w-[40%]" />
          </button>
        ))}
      </div>
      <div
        className="relative w-full flex-1 cursor-zoom-in self-start overflow-hidden rounded-[2rem] shadow-card"
        onPointerMove={(e) => {
          if (e.pointerType !== "mouse") return;
          const r = e.currentTarget.getBoundingClientRect();
          setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
        }}
        onPointerLeave={() => setZoom(null)}
      >
        <div
          key={active}
          className="animate-fade-up transition-transform duration-300 ease-out"
          style={zoom ? { transform: "scale(1.5)", transformOrigin: `${zoom.x}% ${zoom.y}%` } : undefined}
        >
          <ProductArt art={product.art} name={product.name} image={photos[active]} variant={active} priority sizes="(min-width:1024px) 50vw, 100vw" />
        </div>
        <span className="pointer-events-none absolute bottom-4 left-4 rounded-full bg-white/85 px-3 py-1 text-xs font-semibold backdrop-blur">
          {active + 1} / {count}
        </span>
      </div>
    </div>
  );
}
