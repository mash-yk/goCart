import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="container py-8 sm:py-12" aria-busy="true" aria-label="Loading cart">
      <Skeleton className="mb-8 h-12 w-56" />
      <div className="grid gap-8 lg:grid-cols-[1fr_380px]">
        <div className="card space-y-6 p-8">
          {[0, 1, 2].map((i) => (
            <div key={i} className="flex gap-6">
              <Skeleton className="h-32 w-32 rounded-2xl" />
              <div className="flex-1 space-y-3">
                <Skeleton className="h-5 w-2/3" />
                <Skeleton className="h-4 w-1/3" />
                <Skeleton className="h-9 w-32 rounded-full" />
              </div>
            </div>
          ))}
        </div>
        <Skeleton className="h-96 rounded-3xl" />
      </div>
    </div>
  );
}
