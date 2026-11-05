"use client";

import { ChevronDown } from "lucide-react";
import { useCatalogNav } from "./catalog-nav";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: low to high" },
  { value: "price-desc", label: "Price: high to low" },
  { value: "rating", label: "Top rated" },
  { value: "name", label: "Name A–Z" },
] as const;

export function SortSelect({ value }: { value: string }) {
  const { update } = useCatalogNav();
  return (
    <label className="relative inline-flex items-center">
      <span className="sr-only">Sort products</span>
      <select
        value={value}
        onChange={(e) => update({ sort: e.target.value === "featured" ? null : e.target.value })}
        className="h-9 appearance-none rounded-full border border-ink-200 bg-white pl-4 pr-9 text-sm font-semibold hover:border-ink-400 focus:border-brand-violet focus:outline-none"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 h-4 w-4 text-ink-400" />
    </label>
  );
}
