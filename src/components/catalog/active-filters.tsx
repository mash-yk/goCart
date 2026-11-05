"use client";

import { X } from "lucide-react";
import type { Category } from "@/types";
import { useCatalogNav } from "./catalog-nav";

export function ActiveFilters({ categories }: { categories: Category[] }) {
  const { params, update } = useCatalogNav();
  const chips: { key: string; label: string; clear: Record<string, null> }[] = [];

  const q = params.get("q");
  if (q) chips.push({ key: "q", label: `“${q}”`, clear: { q: null } });
  const cat = params.get("category");
  if (cat) chips.push({ key: "category", label: categories.find((c) => c.slug === cat)?.name ?? cat, clear: { category: null } });
  const min = params.get("minPrice");
  const max = params.get("maxPrice");
  if (min || max)
    chips.push({
      key: "price",
      label: min && max ? `$${min} – $${max}` : min ? `$${min}+` : `Under $${max}`,
      clear: { minPrice: null, maxPrice: null },
    });
  const rating = params.get("minRating");
  if (rating) chips.push({ key: "rating", label: `${rating}★ & up`, clear: { minRating: null } });
  if (params.get("inStock") === "true") chips.push({ key: "inStock", label: "In stock", clear: { inStock: null } });
  if (params.get("onSale") === "true") chips.push({ key: "onSale", label: "On sale", clear: { onSale: null } });

  if (chips.length === 0) return null;

  return (
    <div className="mb-6 flex flex-wrap items-center gap-2">
      {chips.map((c) => (
        <button
          key={c.key}
          type="button"
          onClick={() => update(c.clear)}
          className="group inline-flex items-center gap-1.5 rounded-full bg-violet-50 py-1.5 pl-3 pr-2 text-xs font-semibold text-brand-violet ring-1 ring-violet-200 transition hover:bg-violet-100"
          aria-label={`Remove filter ${c.label}`}
        >
          {c.label}
          <X className="h-3.5 w-3.5 transition-transform group-hover:rotate-90" />
        </button>
      ))}
      {chips.length > 1 && (
        <button
          type="button"
          onClick={() =>
            update({ q: null, category: null, minPrice: null, maxPrice: null, minRating: null, inStock: null, onSale: null })
          }
          className="px-2 text-xs font-semibold text-ink-500 underline-offset-4 hover:text-ink hover:underline"
        >
          Clear all
        </button>
      )}
    </div>
  );
}
