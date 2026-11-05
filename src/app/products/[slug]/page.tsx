import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { CheckCircle2, PackageCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";
import { ProductGrid } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { BuyBox } from "@/components/product/buy-box";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { SectionHeading } from "@/components/ui/section-heading";
import { discountPercent, FREE_SHIPPING_THRESHOLD } from "@/lib/business/pricing";
import { isAppError } from "@/lib/errors";
import { catalogService } from "@/lib/services/catalog.service";
import { formatPrice } from "@/lib/utils/format";

type Props = { params: Promise<{ slug: string }> };

async function loadProduct(slug: string) {
  try {
    return await catalogService.getProduct(slug);
  } catch (error) {
    if (isAppError(error) && error.status === 404) notFound();
    throw error;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  try {
    const product = await catalogService.getProduct(slug);
    return { title: product.name, description: product.tagline, openGraph: { title: product.name, description: product.tagline } };
  } catch {
    return { title: "Product not found" };
  }
}

function StockStatus({ stock }: { stock: number }) {
  if (stock <= 0) return <Badge tone="neutral">Out of stock</Badge>;
  if (stock <= 10)
    return (
      <span className="inline-flex items-center gap-2 text-sm font-semibold text-amber-700">
        <span className="h-2 w-2 animate-pulse rounded-full bg-amber-500" /> Only {stock} left, order soon
      </span>
    );
  return (
    <span className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-700">
      <span className="h-2 w-2 rounded-full bg-emerald-500" /> In stock, ships in 1–2 days
    </span>
  );
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  const [categories, related] = await Promise.all([
    catalogService.getCategories(),
    catalogService.getRelatedProducts(product, 4),
  ]);
  const category = categories.find((c) => c.slug === product.categorySlug);
  const discount = discountPercent(product);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    sku: product.slug,
    aggregateRating: { "@type": "AggregateRating", ratingValue: product.rating, reviewCount: product.reviewCount },
    offers: {
      "@type": "Offer",
      priceCurrency: "USD",
      price: (product.price / 100).toFixed(2),
      availability: product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
  };

  return (
    <div className="container py-8 sm:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          ...(category ? [{ label: category.name, href: `/categories/${category.slug}` }] : []),
          { label: product.name },
        ]}
      />

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery product={product} />

        <div>
          <div className="flex flex-wrap items-center gap-2">
            {category && <Badge tone="violet">{category.name}</Badge>}
            {product.featured && <Badge tone="dark">Bestseller</Badge>}
            {discount > 0 && <Badge tone="lime">Save {discount}%</Badge>}
          </div>
          <h1 className="mt-4 text-3xl font-black leading-tight tracking-tight sm:text-5xl">{product.name}</h1>
          <p className="mt-2 text-lg text-ink-500">{product.tagline}</p>
          <a href="#details" className="mt-4 inline-block">
            <Rating value={product.rating} count={product.reviewCount} size="md" />
          </a>

          <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2">
            <Price price={product.price} compareAtPrice={product.compareAtPrice} size="lg" />
            {product.compareAtPrice && product.compareAtPrice > product.price && (
              <span className="rounded-full bg-fuchsia-50 px-3 py-1 text-sm font-bold text-fuchsia-700">
                You save {formatPrice(product.compareAtPrice - product.price)}
              </span>
            )}
          </div>
          <div className="mt-3">
            <StockStatus stock={product.stock} />
          </div>

          <p className="mt-6 leading-relaxed text-ink-600">{product.description}</p>

          <div className="mt-8">
            <BuyBox product={product} />
          </div>

          <ul className="mt-8 grid gap-3 rounded-3xl bg-ink-50 p-5 text-sm sm:grid-cols-2">
            {[
              { icon: Truck, text: `Free shipping over ${formatPrice(FREE_SHIPPING_THRESHOLD)}` },
              { icon: RotateCcw, text: "Free 30-day returns" },
              { icon: ShieldCheck, text: "2-year warranty" },
              { icon: PackageCheck, text: "Plastic-free packaging" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-2.5 font-medium">
                <Icon className="h-5 w-5 text-brand-violet" /> {text}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <section id="details" className="mt-16 grid scroll-mt-28 gap-6 lg:grid-cols-2">
        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Why you&apos;ll love it</h2>
          <ul className="mt-5 space-y-3">
            {product.features.map((f) => (
              <li key={f} className="flex gap-3">
                <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-brand-violet" />
                <span className="text-ink-600">{f}</span>
              </li>
            ))}
          </ul>
        </div>
        <div className="card p-6 sm:p-8">
          <h2 className="text-2xl font-extrabold tracking-tight">Specifications</h2>
          <dl className="mt-5 divide-y divide-ink-100">
            {product.specs.map((s) => (
              <div key={s.label} className="grid grid-cols-[40%_1fr] gap-4 py-3 text-sm">
                <dt className="font-semibold text-ink-500">{s.label}</dt>
                <dd className="font-medium">{s.value}</dd>
              </div>
            ))}
          </dl>
          {product.tags.length > 0 && (
            <div className="mt-6 flex flex-wrap gap-2">
              {product.tags.map((t) => (
                <a key={t} href={`/products?q=${encodeURIComponent(t)}`} className="rounded-full bg-ink-50 px-3 py-1 text-xs font-semibold text-ink-500 hover:bg-violet-50 hover:text-brand-violet">
                  #{t}
                </a>
              ))}
            </div>
          )}
        </div>
      </section>

      {related.length > 0 && (
        <section className="mt-20">
          <SectionHeading
            eyebrow="You might also like"
            title="Related products"
            href={category ? `/categories/${category.slug}` : "/products"}
            linkLabel={category ? `More ${category.name.toLowerCase()}` : "Shop all"}
          />
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
