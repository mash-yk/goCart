import Link from "next/link";
import { SearchX } from "lucide-react";
import { ProductGrid } from "@/components/product/product-card";
import { EmptyState } from "@/components/ui/empty-state";
import { buttonClasses } from "@/components/ui/button";
import { catalogService } from "@/lib/services/catalog.service";
import { productQuerySchema } from "@/lib/validation/schemas";
import { pluralize } from "@/lib/utils/format";
import { ActiveFilters } from "./active-filters";
import { CatalogNavProvider, PendingResults } from "./catalog-nav";
import { Filters, MobileFilters } from "./filters";
import { Pagination } from "./pagination";
import { SortSelect } from "./sort-select";

type Params = Record<string, string | string[] | undefined>;

function first(params: Params) {
  return Object.fromEntries(Object.entries(params).map(([k, v]) => [k, Array.isArray(v) ? v[0] : v]));
}

function countActiveFilters(params: Record<string, string | string[] | undefined>, lockedCategory?: string) {
  let n = 0;
  if (params.category && !lockedCategory) n++;
  if (params.minPrice || params.maxPrice) n++;
  if (params.minRating) n++;
  if (params.inStock === "true") n++;
  if (params.onSale === "true") n++;
  return n;
}

/** Product grid with URL-driven search, filters, sorting and pagination. */
export async function ProductListing({ searchParams, basePath, category }: { searchParams: Params; basePath: string; category?: string }) {
  const raw = first(searchParams);
  const query = productQuerySchema.parse({ ...raw, category: category ?? raw.category });

  const [result, categories, counts] = await Promise.all([
    catalogService.searchProducts(query),
    catalogService.getCategories(),
    catalogService.getCategoryProductCounts(),
  ]);

  const activeCount = countActiveFilters(raw, category);
  const start = (result.page - 1) * result.pageSize + 1;
  const end = Math.min(result.total, result.page * result.pageSize);

  return (
    <CatalogNavProvider>
      <div className="grid gap-8 lg:grid-cols-[260px_1fr]">
        <Filters categories={categories} counts={counts} lockedCategory={category} />
        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-ink-500" aria-live="polite">
              {result.total === 0 ? (
                "No products found"
              ) : (
                <>
                  Showing <span className="font-semibold text-ink">{start}–{end}</span> of{" "}
                  <span className="font-semibold text-ink">{pluralize(result.total, "product")}</span>
                </>
              )}
            </p>
            <div className="flex items-center gap-2">
              <MobileFilters categories={categories} counts={counts} lockedCategory={category} activeCount={activeCount} />
              <SortSelect value={query.sort} />
            </div>
          </div>
          <ActiveFilters categories={category ? [] : categories} />
          <PendingResults>
            {result.items.length > 0 ? (
              <>
                <ProductGrid products={result.items} priorityCount={4} />
                <Pagination page={result.page} totalPages={result.totalPages} basePath={basePath} params={raw} />
              </>
            ) : (
              <EmptyState
                icon={<SearchX className="h-9 w-9" />}
                title="Nothing matches… yet"
                description={
                  query.q
                    ? `We couldn't find anything for “${query.q}”. Try a different word or loosen your filters.`
                    : "Try removing a filter or two to see more products."
                }
                action={
                  <Link href={basePath} className={buttonClasses("primary")}>
                    Clear all filters
                  </Link>
                }
              />
            )}
          </PendingResults>
        </div>
      </div>
    </CatalogNavProvider>
  );
}
