import Link from "next/link";
import { ProductArt } from "@/components/art/product-art";
import { Badge } from "@/components/ui/badge";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { discountPercent } from "@/lib/business/pricing";
import { cn } from "@/lib/utils/cn";
import type { Product } from "@/types";
import { QuickAddButton } from "./quick-add-button";
import { WishlistButton } from "./wishlist-button";

export function ProductCard({ product, priority, className }: { product: Product; priority?: boolean; className?: string }) {
  const discount = discountPercent(product);
  const outOfStock = product.stock <= 0;
  const lowStock = !outOfStock && product.stock <= 10;

  return (
    <article
      className={cn(
        "group relative flex flex-col rounded-[1.75rem] border border-ink-100 bg-white p-2.5 shadow-card transition-all duration-500 hover:-translate-y-1.5 hover:shadow-card-hover sm:p-3",
        className,
      )}
    >
      <Link href={`/products/${product.slug}`} className="relative block overflow-hidden rounded-[1.35rem]" tabIndex={-1} aria-hidden>
        <ProductArt
          art={product.art}
          name={product.name}
          image={product.images[0]}
          priority={priority}
          className={cn("transition-transform duration-700 group-hover:scale-[1.06]", outOfStock && "grayscale-[60%]")}
        />
        <div className="absolute left-2.5 top-2.5 flex flex-col gap-1.5">
          {discount > 0 && <Badge tone="lime">-{discount}%</Badge>}
          {product.featured && discount === 0 && <Badge tone="dark">Bestseller</Badge>}
          {outOfStock && <Badge tone="neutral" className="bg-white/90">Sold out</Badge>}
          {lowStock && <Badge tone="warning" className="bg-amber-100/95">Only {product.stock} left</Badge>}
        </div>
      </Link>
      <WishlistButton productSlug={product.slug} productName={product.name} className="absolute right-5 top-5 z-10 sm:right-6 sm:top-6" />

      <div className="flex flex-1 flex-col px-1.5 pb-1 pt-3 sm:px-2">
        <p className="text-[11px] font-bold uppercase tracking-widest text-ink-400">{product.categorySlug.replace("-", " ")}</p>
        <h3 className="mt-1 line-clamp-2 text-sm font-bold leading-snug sm:text-base">
          <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 after:rounded-[1.75rem] hover:text-brand-violet">
            {product.name}
          </Link>
        </h3>
        <Rating value={product.rating} count={product.reviewCount} className="mt-1.5" />
        <div className="mt-auto flex items-end justify-between gap-2 pt-3">
          <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="flex-wrap gap-x-2 gap-y-0" />
          <div className="relative z-10">
            <QuickAddButton productSlug={product.slug} productName={product.name} disabled={outOfStock} />
          </div>
        </div>
      </div>
    </article>
  );
}

export function ProductGrid({ products, priorityCount = 0 }: { products: Product[]; priorityCount?: number }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.slug} product={p} priority={i < priorityCount} />
      ))}
    </div>
  );
}
