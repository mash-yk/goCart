import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

/** Placeholder shown while the product listing streams in. */
export function ListingSkeleton() {
  return (
    <div className="grid gap-8 lg:grid-cols-[260px_1fr]" aria-busy="true" aria-label="Loading products">
      <Skeleton className="hidden h-[560px] rounded-3xl lg:block" />
      <div>
        <div className="mb-5 flex justify-between">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-9 w-40 rounded-full" />
        </div>
        <ProductGridSkeleton count={8} />
      </div>
    </div>
  );
}
