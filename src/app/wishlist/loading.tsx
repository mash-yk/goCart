import { ProductGridSkeleton, Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8 sm:py-12" aria-busy="true" aria-label="Loading wishlist">
      <Skeleton className="mb-3 h-12 w-64" />
      <Skeleton className="mb-8 h-5 w-48" />
      <ProductGridSkeleton count={4} />
    </div>
  );
}
