import Link from "next/link";
import { Zap } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { buttonClasses } from "@/components/ui/button";
import type { Product } from "@/types";
import { Countdown } from "./countdown";

export function DealsSection({ deals }: { deals: Product[] }) {
  if (deals.length === 0) return null;
  return (
    <section className="container">
      <div className="relative overflow-hidden rounded-[2.5rem] bg-ink p-6 text-white sm:p-10">
        <div className="absolute -left-20 -top-20 h-72 w-72 animate-blob rounded-full bg-brand-violet/50 blur-3xl" aria-hidden />
        <div className="absolute -bottom-24 right-0 h-80 w-80 animate-blob rounded-full bg-brand-orange/40 blur-3xl [animation-delay:-6s]" aria-hidden />
        <div className="relative mb-8 flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <span className="inline-flex items-center gap-1.5 rounded-full bg-lime-300 px-3 py-1 text-xs font-black text-ink">
              <Zap className="h-3.5 w-3.5" /> FLASH DEALS
            </span>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-5xl">
              Steals that won&apos;t <span className="text-gradient">last.</span>
            </h2>
            <p className="mt-2 max-w-lg text-ink-200">Our biggest markdowns of the week, refreshed every night at midnight.</p>
          </div>
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center">
            <Countdown />
            <Link href="/products?onSale=true" className={buttonClasses("primary", "md")}>
              All deals
            </Link>
          </div>
        </div>
        <div className="relative grid grid-cols-2 gap-3 text-ink sm:gap-5 lg:grid-cols-4">
          {deals.map((p) => (
            <ProductCard key={p.slug} product={p} />
          ))}
        </div>
      </div>
    </section>
  );
}
