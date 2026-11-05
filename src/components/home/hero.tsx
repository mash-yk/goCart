import Link from "next/link";
import { ArrowRight, Sparkles, Star, Truck } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";
import type { Product } from "@/types";
import { HeroVisual } from "./hero-visual";

export function Hero({ products, productCount, avgRating }: { products: Product[]; productCount: number; avgRating: number }) {
  return (
    <section className="relative overflow-hidden">
      <div className="mesh-bg absolute inset-0" aria-hidden />
      <div className="container relative grid items-center gap-10 py-12 sm:py-16 lg:grid-cols-[1.05fr_1fr] lg:py-20">
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-violet-200 bg-white/70 px-3 py-1.5 text-xs font-bold text-brand-violet backdrop-blur">
            <Sparkles className="h-3.5 w-3.5" /> New season drop is live
          </span>
          <h1 className="mt-5 text-[2.6rem] font-black leading-[1.02] tracking-tight sm:text-6xl lg:text-7xl">
            Gear that makes your everyday{" "}
            <span className="text-gradient animate-gradient-x">glow.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-500">
            Headphones that hush the world, watches that cheer you on and desk upgrades that spark flow, picked for people who like their tech bold.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className={buttonClasses("primary", "lg", "group")}>
              Shop the collection
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/products?onSale=true" className={buttonClasses("outline", "lg")}>
              Today&apos;s deals
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4">
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Products</dt>
              <dd className="mt-1 text-2xl font-black">{productCount}+</dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Avg rating</dt>
              <dd className="mt-1 flex items-center gap-1 text-2xl font-black">
                {avgRating.toFixed(1)} <Star className="h-5 w-5 fill-amber-400 text-amber-400" />
              </dd>
            </div>
            <div>
              <dt className="text-xs font-semibold uppercase tracking-widest text-ink-400">Shipping</dt>
              <dd className="mt-1 flex items-center gap-1.5 text-2xl font-black">
                Free <Truck className="h-5 w-5 text-brand-violet" />
              </dd>
            </div>
          </dl>
        </div>
        <HeroVisual products={products} />
      </div>
    </section>
  );
}
