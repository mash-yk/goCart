import { Suspense } from "react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ProductArt } from "@/components/art/product-art";
import { ListingSkeleton } from "@/components/catalog/listing-skeleton";
import { ProductListing } from "@/components/catalog/product-listing";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { isAppError } from "@/lib/errors";
import { catalogService } from "@/lib/services/catalog.service";

type Props = {
  params: Promise<{ slug: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
};

async function loadCategory(slug: string) {
  try {
    return await catalogService.getCategory(slug);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const categories = await catalogService.getCategories();
  const category = categories.find((c) => c.slug === slug);
  return category ? { title: category.name, description: category.description } : { title: "Category not found" };
}

export default async function CategoryPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const [category, sp] = await Promise.all([loadCategory(slug), searchParams]);

  return (
    <div className="container py-8 sm:py-12">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Shop", href: "/products" }, { label: category.name }]} />
      <header
        className="relative mb-10 overflow-hidden rounded-[2.5rem] p-8 text-white sm:p-12"
        style={{ backgroundImage: `linear-gradient(135deg, ${category.art.from}, ${category.art.to})` }}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_10%,rgba(255,255,255,0.35),transparent_50%)]" aria-hidden />
        <div className="relative grid items-center gap-6 md:grid-cols-[1fr_auto]">
          <div className="max-w-xl">
            <p className="text-xs font-bold uppercase tracking-[0.2em] text-white/80">{category.tagline}</p>
            <h1 className="mt-2 text-4xl font-black tracking-tight sm:text-6xl">{category.name}</h1>
            <p className="mt-3 text-white/90 sm:text-lg">{category.description}</p>
          </div>
          <ProductArt
            art={category.art}
            name={`${category.name} illustration`}
            variant={1}
            className="hidden w-56 rotate-6 rounded-[2rem] border-4 border-white/40 shadow-2xl md:grid"
          />
        </div>
      </header>
      <Suspense fallback={<ListingSkeleton />}>
        <ProductListing searchParams={sp} basePath={`/categories/${category.slug}`} category={category.slug} />
      </Suspense>
    </div>
  );
}
