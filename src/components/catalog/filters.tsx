"use client";

import { useEffect, useId, useState } from "react";
import { Check, SlidersHorizontal, Star, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";
import { useCatalogNav } from "./catalog-nav";

const PRICE_PRESETS = [
  { label: "Under $50", min: "", max: "50" },
  { label: "$50 – $150", min: "50", max: "150" },
  { label: "$150 – $300", min: "150", max: "300" },
  { label: "$300+", min: "300", max: "" },
];

function Toggle({ label, checked, onChange }: { label: string; checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-3 py-1.5 text-sm font-medium">
      {label}
      <span className="relative">
        <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
        <span className="block h-6 w-11 rounded-full bg-ink-200 transition peer-checked:bg-brand-violet peer-focus-visible:ring-2 peer-focus-visible:ring-brand-violet peer-focus-visible:ring-offset-2" />
        <span className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition peer-checked:translate-x-5" />
      </span>
    </label>
  );
}

function Group({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();
  return (
    <div role="group" aria-labelledby={id} className="border-b border-ink-100 py-5 first:pt-0 last:border-0 last:pb-0">
      <p id={id} className="mb-3 text-xs font-bold uppercase tracking-[0.18em] text-ink-400">
        {title}
      </p>
      {children}
    </div>
  );
}

function FilterPanel({ categories, counts, lockedCategory }: FilterProps) {
  const { params, update } = useCatalogNav();
  const [min, setMin] = useState(params.get("minPrice") ?? "");
  const [max, setMax] = useState(params.get("maxPrice") ?? "");
  const [priceError, setPriceError] = useState<string>();

  const minParam = params.get("minPrice") ?? "";
  const maxParam = params.get("maxPrice") ?? "";
  useEffect(() => {
    setMin(minParam);
    setMax(maxParam);
  }, [minParam, maxParam]);

  const activeCategory = params.get("category") ?? "";
  const minRating = params.get("minRating") ?? "";

  function applyPrice(e: React.FormEvent) {
    e.preventDefault();
    const lo = min === "" ? undefined : Number(min);
    const hi = max === "" ? undefined : Number(max);
    if ((lo !== undefined && (Number.isNaN(lo) || lo < 0)) || (hi !== undefined && (Number.isNaN(hi) || hi < 0))) {
      setPriceError("Enter a positive number.");
      return;
    }
    if (lo !== undefined && hi !== undefined && lo > hi) {
      setPriceError("Min price can't be more than max.");
      return;
    }
    setPriceError(undefined);
    update({ minPrice: min || null, maxPrice: max || null });
  }

  return (
    <div>
      {!lockedCategory && (
        <Group title="Category">
          <ul className="space-y-1">
            {[{ slug: "", name: "All products" }, ...categories].map((c) => {
              const active = activeCategory === c.slug;
              return (
                <li key={c.slug || "all"}>
                  <button
                    type="button"
                    onClick={() => update({ category: c.slug || null })}
                    aria-pressed={active}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm font-medium transition",
                      active ? "bg-ink text-white dark:bg-[#FDC841] dark:text-[#181715]" : "hover:bg-ink-50 dark:hover:bg-[#252320] text-ink dark:text-[#F5F3EF]",
                    )}
                  >
                    {c.name}
                    <span className={cn("text-xs", active ? "text-white/70 dark:text-[#181715]/80" : "text-ink-400 dark:text-[#A39E93]")}>
                      {c.slug ? (counts[c.slug] ?? 0) : Object.values(counts).reduce((a, b) => a + b, 0)}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Group>
      )}

      <Group title="Price">
        <div className="mb-3 flex flex-wrap gap-2">
          {PRICE_PRESETS.map((p) => {
            const active = minParam === p.min && maxParam === p.max;
            return (
              <button
                key={p.label}
                type="button"
                aria-pressed={active}
                onClick={() => update(active ? { minPrice: null, maxPrice: null } : { minPrice: p.min || null, maxPrice: p.max || null })}
                className={cn(
                  "rounded-full border px-3 py-1.5 text-xs font-semibold transition",
                  active ? "border-brand-violet bg-violet-50 text-brand-violet" : "border-ink-200 hover:border-ink-400",
                )}
              >
                {p.label}
              </button>
            );
          })}
        </div>
        <form onSubmit={applyPrice} noValidate className="flex items-end gap-2">
          {[
            { id: "min", label: "Min", value: min, set: setMin },
            { id: "max", label: "Max", value: max, set: setMax },
          ].map((f) => (
            <label key={f.id} className="flex-1 text-xs font-semibold text-ink-500">
              {f.label} ($)
              <input
                type="number"
                inputMode="decimal"
                min={0}
                value={f.value}
                onChange={(e) => f.set(e.target.value)}
                aria-invalid={Boolean(priceError) || undefined}
                className="mt-1 h-10 w-full rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink focus:border-brand-violet focus:outline-none"
              />
            </label>
          ))}
          <Button type="submit" variant="dark" size="sm" className="h-10">
            Go
          </Button>
        </form>
        {priceError && (
          <p role="alert" className="mt-2 text-xs font-semibold text-rose-600">
            {priceError}
          </p>
        )}
      </Group>

      <Group title="Rating">
        <div className="space-y-1">
          {["4.5", "4", "3"].map((r) => {
            const active = minRating === r;
            return (
              <button
                key={r}
                type="button"
                aria-pressed={active}
                onClick={() => update({ minRating: active ? null : r })}
                className={cn(
                  "flex w-full items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition",
                  active ? "bg-amber-50 text-amber-800 ring-1 ring-amber-300" : "hover:bg-ink-50",
                )}
              >
                <Star className="h-4 w-4 fill-amber-400 text-amber-400" />
                {r} &amp; up
                {active && <Check className="ml-auto h-4 w-4" />}
              </button>
            );
          })}
        </div>
      </Group>

      <Group title="Availability">
        <Toggle label="In stock only" checked={params.get("inStock") === "true"} onChange={(v) => update({ inStock: v ? "true" : null })} />
        <Toggle label="On sale" checked={params.get("onSale") === "true"} onChange={(v) => update({ onSale: v ? "true" : null })} />
      </Group>
    </div>
  );
}

interface FilterProps {
  categories: Category[];
  counts: Record<string, number>;
  lockedCategory?: string;
}

export function Filters(props: FilterProps) {
  return (
    <aside className="hidden lg:block" aria-label="Filters">
      <div className="card sticky top-28 p-5">
        <FilterPanel {...props} />
      </div>
    </aside>
  );
}

/** Slide-over filter drawer for small screens. */
export function MobileFilters({ activeCount, ...props }: FilterProps & { activeCount: number }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="lg:hidden">
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} aria-expanded={open}>
        <SlidersHorizontal className="h-4 w-4" />
        Filters
        {activeCount > 0 && (
          <span className="grid h-5 min-w-5 place-items-center rounded-full bg-brand-violet px-1 text-[11px] font-bold text-white">
            {activeCount}
          </span>
        )}
      </Button>
      {open && (
        <div className="fixed inset-0 z-[60]" role="dialog" aria-modal="true" aria-label="Filters">
          <button className="absolute inset-0 bg-ink/40 backdrop-blur-sm" aria-label="Close filters" onClick={() => setOpen(false)} />
          <div className="absolute inset-y-0 left-0 flex w-[88%] max-w-sm flex-col bg-white shadow-2xl animate-[slide-in_0.3s_ease-out]">
            <div className="flex items-center justify-between border-b border-ink-100 px-5 py-4">
              <p className="text-lg font-bold">Filters</p>
              <button onClick={() => setOpen(false)} className="grid h-10 w-10 place-items-center rounded-full hover:bg-ink-50" aria-label="Close filters">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-5">
              <FilterPanel {...props} />
            </div>
            <div className="border-t border-ink-100 p-4">
              <Button className="w-full" onClick={() => setOpen(false)}>
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
