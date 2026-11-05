import { Suspense } from "react";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { ProductListing } from "@/components/catalog/product-listing";

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { q } = await searchParams;
  return typeof q === "string" && q ? { title: `Search: ${q}` } : { title: "Shop all products" };
}

export default async function ProductsPage({ searchParams }: { searchParams: SearchParams }) {
  const params = await searchParams;
  const q = typeof params.q === "string" ? params.q.trim() : "";

  return (
    <div className="container py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: q ? "Search" : "Shop all" }]} />
      <header className="mb-8">
        <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
          {q ? (
            <>
              Results for <span className="text-gradient">“{q}”</span>
            </>
          ) : (
            <>
              Shop <span className="text-gradient">everything</span>
            </>
          )}
        </h1>
        <p className="mt-2 text-ink-500">Bold gear across audio, wearables, smart home, workspace, travel and fitness.</p>
      </header>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={params} basePath="/products" />
      </Suspense>
    </div>
  );
}
