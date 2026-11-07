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
          <span className="inline-flex items-center gap-2 rounded-full border border-[#FDC841]/40 bg-[#FDC841]/15 px-3.5 py-1.5 text-xs font-bold text-[#855000] dark:text-[#FDC841] backdrop-blur-sm shadow-sm">
            <Sparkles className="h-3.5 w-3.5 text-[#F59E0B] fill-[#FDC841]" /> New season drop is live
          </span>
          <h1 className="mt-5 text-[2.6rem] font-black leading-[1.04] tracking-tight sm:text-6xl lg:text-7xl text-ink dark:text-[#F5F3EF]">
            Gear that makes your everyday{" "}
            <span className="text-gradient">glow.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-ink-500 dark:text-[#A39E93] leading-relaxed font-normal">
            Headphones that hush the world, watches that cheer you on, and workspace upgrades picked for people who appreciate aesthetic craft.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/products" className={buttonClasses("primary", "lg", "group shadow-glow")}>
              Shop the collection
              <ArrowRight className="h-5 w-5 transition-transform group-hover:translate-x-1" />
            </Link>
            <Link href="/products?onSale=true" className={buttonClasses("outline", "lg")}>
              Today&apos;s deals
            </Link>
          </div>
          <dl className="mt-10 grid max-w-lg grid-cols-3 gap-3">
            <div className="card p-3.5 text-center sm:text-left">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#A39E93]">Products</dt>
              <dd className="mt-1 text-2xl font-black text-ink dark:text-[#F5F3EF]">{productCount}+</dd>
            </div>
            <div className="card p-3.5 text-center sm:text-left">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#A39E93]">Avg rating</dt>
              <dd className="mt-1 flex items-center justify-center sm:justify-start gap-1 text-2xl font-black text-ink dark:text-[#F5F3EF]">
                {avgRating.toFixed(1)} <Star className="h-5 w-5 fill-[#FDC841] text-[#FDC841]" />
              </dd>
            </div>
            <div className="card p-3.5 text-center sm:text-left">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-ink-400 dark:text-[#A39E93]">Shipping</dt>
              <dd className="mt-1 flex items-center justify-center sm:justify-start gap-1.5 text-2xl font-black text-ink dark:text-[#F5F3EF]">
                Free <Truck className="h-5 w-5 text-emerald-600" />
              </dd>
            </div>
          </dl>
        </div>
        <HeroVisual products={products} />
      </div>
    </section>
  );
}
