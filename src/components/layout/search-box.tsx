"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Loader2, Search, X } from "lucide-react";
import { ProductArt } from "@/components/art/product-art";
import { apiFetch } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { Art } from "@/types";

interface Suggestion {
  slug: string;
  name: string;
  price: number;
  categorySlug: string;
  art: Art;
}

/** Header search with debounced, keyboard-navigable suggestions. */
export function SearchBox({ className, autoFocus, onNavigate }: { className?: string; autoFocus?: boolean; onNavigate?: () => void }) {
  const router = useRouter();
  const params = useSearchParams();
  const listId = useId();
  const [query, setQuery] = useState(params.get("q") ?? "");
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [active, setActive] = useState(-1);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) {
      setSuggestions([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      try {
        const res = await apiFetch<{ suggestions: Suggestion[] }>(`/api/search?q=${encodeURIComponent(term)}`, {
          signal: controller.signal,
        });
        setSuggestions(res.suggestions);
        setActive(-1);
      } catch {
        setSuggestions([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 200);
    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  useEffect(() => {
    function onClick(e: MouseEvent) {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, []);

  function go(href: string) {
    setOpen(false);
    onNavigate?.();
    router.push(href);
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (active >= 0 && suggestions[active]) return go(`/products/${suggestions[active].slug}`);
    const term = query.trim();
    go(term ? `/products?q=${encodeURIComponent(term)}` : "/products");
  }

  function onKeyDown(e: React.KeyboardEvent) {
    if (!open || suggestions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setActive((i) => (i + 1) % suggestions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setActive((i) => (i <= 0 ? suggestions.length - 1 : i - 1));
    } else if (e.key === "Escape") {
      setOpen(false);
    }
  }

  const showDropdown = open && query.trim().length >= 2;

  return (
    <div ref={boxRef} className={cn("relative", className)}>
      <form onSubmit={submit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Search products
        </label>
        <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-[#A39E93]" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          value={query}
          autoFocus={autoFocus}
          autoComplete="off"
          placeholder="Search headphones, watches, lamps..."
          onChange={(e) => {
            setQuery(e.target.value);
            setOpen(true);
          }}
          onFocus={() => setOpen(true)}
          onKeyDown={onKeyDown}
          role="combobox"
          aria-expanded={showDropdown}
          aria-controls={listId}
          aria-activedescendant={active >= 0 ? `${listId}-${active}` : undefined}
          className="h-11 w-full rounded-full border border-[#E5DED0] bg-white/90 pl-11 pr-10 text-sm text-ink placeholder:text-ink-400 transition focus:border-[#F5B82E] focus:bg-white focus:outline-none focus:ring-4 focus:ring-[#FDC841]/25 dark:border-[#2C2924] dark:bg-[#1A1916] dark:text-[#F5F3EF] dark:placeholder:text-[#7A756C] dark:focus:bg-[#1A1916] [&::-webkit-search-cancel-button]:hidden"
        />
        {loading ? (
          <Loader2 className="absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 animate-spin text-ink-400 dark:text-[#A39E93]" aria-hidden />
        ) : query ? (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 grid h-6 w-6 -translate-y-1/2 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink dark:text-[#A39E93] dark:hover:bg-[#252320] dark:hover:text-[#F5F3EF]"
            aria-label="Clear search"
          >
            <X className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </form>

      {showDropdown && (
        <div className="absolute inset-x-0 top-[calc(100%+8px)] z-50 overflow-hidden rounded-3xl border border-[#EDE7D9] bg-white/95 p-2 shadow-card-hover backdrop-blur-md dark:border-[#2C2924] dark:bg-[#181715]/95 dark:shadow-2xl">
          {suggestions.length > 0 ? (
            <ul id={listId} role="listbox" aria-label="Search suggestions">
              {suggestions.map((s, i) => (
                <li key={s.slug} id={`${listId}-${i}`} role="option" aria-selected={i === active}>
                  <Link
                    href={`/products/${s.slug}`}
                    onClick={() => {
                      setOpen(false);
                      onNavigate?.();
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn("flex items-center gap-3 rounded-2xl p-2 transition", i === active ? "bg-ink-50 dark:bg-[#252320]" : "hover:bg-ink-50 dark:hover:bg-[#252320]")}
                  >
                    <ProductArt art={s.art} name={s.name} className="h-11 w-11 shrink-0 rounded-xl" iconClassName="h-5 w-5" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-ink dark:text-[#F5F3EF]">{s.name}</span>
                      <span className="block text-xs capitalize text-ink-400 dark:text-[#A39E93]">{s.categorySlug.replace("-", " ")}</span>
                    </span>
                    <span className="text-sm font-bold text-ink dark:text-[#F5F3EF]">{formatPrice(s.price)}</span>
                  </Link>
                </li>
              ))}
              <li>
                <button
                  type="button"
                  onClick={() => go(`/products?q=${encodeURIComponent(query.trim())}`)}
                  className="mt-1 w-full rounded-2xl bg-[#FDC841]/15 px-3 py-2.5 text-left text-sm font-semibold text-[#855000] dark:text-[#FDC841] hover:bg-[#FDC841]/25 transition"
                >
                  See all results for &ldquo;{query.trim()}&rdquo;
                </button>
              </li>
            </ul>
          ) : !loading ? (
            <p className="px-3 py-4 text-sm text-ink-500 dark:text-[#A39E93]">
              No products match &ldquo;{query.trim()}&rdquo;. Try a different word.
            </p>
          ) : (
            <p className="px-3 py-4 text-sm text-ink-400 dark:text-[#A39E93]">Searching...</p>
          )}
        </div>
      )}
    </div>
  );
}
