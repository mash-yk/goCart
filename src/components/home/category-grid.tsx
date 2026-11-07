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
          className="group relative overflow-hidden rounded-[2rem] p-4 text-ink border border-[#EDE7D9] bg-white shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover dark:border-[#2C2924] dark:bg-[#1A1916] dark:text-[#F5F3EF] dark:shadow-none"
        >
          <div className="relative flex items-start justify-between">
            <span className="text-[11px] font-bold uppercase tracking-wider text-ink-500 dark:text-[#A39E93]">{counts[c.slug] ?? 0} items</span>
            <div className="grid h-7 w-7 place-items-center rounded-full bg-ink-50 text-ink group-hover:bg-[#1E1E1E] group-hover:text-white dark:bg-[#252320] dark:text-[#F5F3EF] dark:group-hover:bg-[#FDC841] dark:group-hover:text-[#181715] transition-colors duration-300">
              <ArrowUpRight className="h-4 w-4" />
            </div>
          </div>
          <ProductArt
            art={c.art}
            name={`${c.name} category`}
            variant={i}
            className="mx-auto my-3 w-[82%] rounded-2xl shadow-sm transition-transform duration-700 group-hover:scale-105"
          />
          <p className="relative text-base font-extrabold leading-tight text-ink dark:text-[#F5F3EF]">{c.name}</p>
          <p className="relative text-xs text-ink-500 dark:text-[#A39E93] truncate mt-0.5">{c.tagline}</p>
        </Link>
      ))}
    </div>
  );
}
