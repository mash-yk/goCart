"use client";

import { useRef, useState } from "react";
import Link from "next/link";
import { Star } from "lucide-react";
import { ProductArt } from "@/components/art/product-art";
import { formatPrice } from "@/lib/utils/format";
import type { Product } from "@/types";

/** Floating product cards that tilt with the pointer for a playful parallax effect. */
export function HeroVisual({ products }: { products: Product[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  function onMove(e: React.PointerEvent) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    setTilt({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 2,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 2,
    });
  }

  const [main, second, third] = products;
  if (!main) return null;

  const layer = (depth: number) => ({
    transform: `translate3d(${tilt.x * depth}px, ${tilt.y * depth}px, 0)`,
    transition: "transform 0.4s cubic-bezier(.2,.8,.2,1)",
  });

  return (
    <div
      ref={ref}
      onPointerMove={onMove}
      onPointerLeave={() => setTilt({ x: 0, y: 0 })}
      className="relative mx-auto aspect-square w-full max-w-[520px]"
    >
      <div className="absolute inset-[8%] animate-blob rounded-full bg-[#FDC841]/22 blur-3xl" aria-hidden />
      <div className="absolute inset-[20%] animate-blob rounded-full bg-[#F5B82E]/16 blur-3xl [animation-delay:-5s]" aria-hidden />

      <div className="absolute left-[20%] top-[12%] w-[58%]" style={layer(-14)}>
        <Link
          href={`/products/${main.slug}`}
          className="block animate-float overflow-hidden rounded-[2rem] border-2 border-white/80 bg-white shadow-card-hover dark:border-[#2C2924] dark:bg-[#1A1916]"
          style={{ transform: `perspective(900px) rotateY(${tilt.x * 8}deg) rotateX(${-tilt.y * 8}deg)` }}
        >
          <ProductArt art={main.art} name={main.name} priority sizes="(min-width:1024px) 320px, 60vw" />
          <div className="flex items-center justify-between gap-2 p-4">
            <div className="min-w-0">
              <p className="truncate text-sm font-bold">{main.name}</p>
              <p className="flex items-center gap-1 text-xs text-ink-400">
                <Star className="h-3 w-3 fill-[#FDC841] text-[#FDC841]" /> {main.rating}<span className="hidden sm:inline"> · {main.reviewCount.toLocaleString()} reviews</span>
              </p>
            </div>
            <span className="shrink-0 rounded-full bg-[#1E1E1E] px-3.5 py-1.5 text-sm font-bold text-white shadow-sm">{formatPrice(main.price)}</span>
          </div>
        </Link>
      </div>

      {second && (
        <div className="absolute left-0 top-0 w-[32%]" style={layer(22)}>
          <Link
            href={`/products/${second.slug}`}
            className="block animate-float overflow-hidden rounded-3xl border-4 border-white bg-white shadow-card-hover dark:border-[#2C2924] dark:bg-[#1A1916] [animation-delay:-2s]"
          >
            <ProductArt art={second.art} name={second.name} variant={1} sizes="200px" />
            <p className="truncate px-3 py-2 text-xs font-bold">{second.name}</p>
          </Link>
        </div>
      )}

      {third && (
        <div className="absolute right-0 top-[26%] w-[33%]" style={layer(30)}>
          <Link
            href={`/products/${third.slug}`}
            className="block animate-float overflow-hidden rounded-3xl border-4 border-white bg-white shadow-card-hover dark:border-[#2C2924] dark:bg-[#1A1916] [animation-delay:-4s]"
          >
            <ProductArt art={third.art} name={third.name} variant={2} sizes="200px" />
            <p className="truncate px-3 py-2 text-xs font-bold">{third.name}</p>
          </Link>
        </div>
      )}

      <div className="absolute bottom-[4%] left-[6%]" style={layer(40)}>
        <span className="block -rotate-6 rounded-2xl bg-lime-300 px-4 py-2 text-sm font-black text-ink shadow-card">
          Up to 25% off
        </span>
      </div>
    </div>
  );
}
