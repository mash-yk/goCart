"use client";

import { createContext, useCallback, useContext, useTransition, type ReactNode } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { cn } from "@/lib/utils/cn";

interface CatalogNav {
  pending: boolean;
  /** Set (or with `null`, remove) query parameters. Resets to page 1 unless `page` is set. */
  update: (changes: Record<string, string | null>) => void;
  params: URLSearchParams;
}

const Ctx = createContext<CatalogNav | null>(null);

/** Keeps filter state in the URL so results are shareable, and dims results while loading. */
export function CatalogNavProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = useCallback(
    (changes: Record<string, string | null>) => {
      const next = new URLSearchParams(searchParams.toString());
      for (const [key, value] of Object.entries(changes)) {
        if (value === null || value === "") next.delete(key);
        else next.set(key, value);
      }
      if (!("page" in changes)) next.delete("page");
      const qs = next.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname, { scroll: false }));
    },
    [router, pathname, searchParams],
  );

  return (
    <Ctx.Provider value={{ pending, update, params: new URLSearchParams(searchParams.toString()) }}>{children}</Ctx.Provider>
  );
}

export function useCatalogNav() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useCatalogNav must be used inside <CatalogNavProvider>");
  return ctx;
}

export function PendingResults({ children }: { children: ReactNode }) {
  const { pending } = useCatalogNav();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-300", pending && "pointer-events-none opacity-50")}>
      {children}
    </div>
  );
}
