import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ProductArt } from "@/components/art/product-art";
import type { Category } from "@/types";

export function CategoryGrid({ categories, counts }: { categories: Category[]; counts: Record<string, number> }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-6">
      {categories.map((c, i) => (
        <Link
          key={c.slug}
          href={`/categories/${c.slug}`}
          className="group relative overflow-hidden rounded-[1.75rem] p-4 text-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover"
          style={{ backgroundImage: `linear-gradient(150deg, ${c.art.from}, ${c.art.to})` }}
        >
          <div className="absolute -right-6 -top-6 h-24 w-24 rounded-full bg-white/20 blur-xl transition-transform duration-700 group-hover:scale-150" aria-hidden />
          <div className="relative flex items-start justify-between">
            <span className="text-xs font-bold uppercase tracking-widest text-white/80">{counts[c.slug] ?? 0} items</span>
            <ArrowUpRight className="h-5 w-5 transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
          </div>
          <ProductArt
            art={{ ...c.art, from: "transparent", to: "transparent" }}
            name={`${c.name} category`}
            variant={i}
            className="mx-auto my-2 w-[78%] rounded-full !bg-none transition-transform duration-700 group-hover:rotate-6 group-hover:scale-110"
          />
          <p className="relative text-lg font-extrabold leading-tight">{c.name}</p>
          <p className="relative text-xs text-white/80">{c.tagline}</p>
        </Link>
      ))}
    </div>
  );
}
