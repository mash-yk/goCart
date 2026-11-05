import { Hero } from "@/components/home/hero";
import { BrandMarquee } from "@/components/home/brand-marquee";
import { CategoryGrid } from "@/components/home/category-grid";
import { DealsSection } from "@/components/home/deals-section";
import { NewsletterSection } from "@/components/home/newsletter-section";
import { Perks } from "@/components/home/perks";
import { ProductRail } from "@/components/home/product-rail";
import { ProductGrid } from "@/components/product/product-card";
import { SectionHeading } from "@/components/ui/section-heading";
import { catalogService } from "@/lib/services/catalog.service";

export const dynamic = "force-dynamic";

export default async function HomePage() {
  const [categories, counts, featured, deals, newArrivals] = await Promise.all([
    catalogService.getCategories(),
    catalogService.getCategoryProductCounts(),
    catalogService.getFeaturedProducts(8),
    catalogService.getDeals(4),
    catalogService.getNewArrivals(10),
  ]);

  const productCount = Object.values(counts).reduce((a, b) => a + b, 0);
  const avgRating = featured.length ? featured.reduce((s, p) => s + p.rating, 0) / featured.length : 0;

  return (
    <div className="space-y-20 pb-20 sm:space-y-28">
      <div>
        <Hero products={featured.slice(0, 3)} productCount={productCount} avgRating={avgRating} />
        <BrandMarquee />
      </div>

      <section className="container">
        <SectionHeading
          eyebrow="Browse"
          title={<>Shop by <span className="text-gradient">vibe</span></>}
          description="Six collections, one rule: everything has to make your day a little brighter."
          href="/products"
          linkLabel="Shop everything"
        />
        <CategoryGrid categories={categories} counts={counts} />
      </section>

      <section className="container">
        <SectionHeading
          eyebrow="Bestsellers"
          title="Fan favourites"
          description="The pieces our community can't stop talking about."
          href="/products?sort=rating"
        />
        <ProductGrid products={featured} />
      </section>

      <DealsSection deals={deals} />

      <section className="container">
        <SectionHeading eyebrow="Just landed" title="New arrivals" description="Fresh drops from this month." />
        <ProductRail products={newArrivals} label="New arrivals" />
      </section>

      <Perks />
      <NewsletterSection />
    </div>
  );
}
