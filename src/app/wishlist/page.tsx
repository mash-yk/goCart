import type { Metadata } from "next";
import Link from "next/link";
import { Heart } from "lucide-react";
import { ProductArt } from "@/components/art/product-art";
import { WishlistActions } from "@/components/product/move-to-cart-button";
import { buttonClasses } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/empty-state";
import { Price } from "@/components/ui/price";
import { Rating } from "@/components/ui/rating";
import { getCurrentUser, getOwner } from "@/lib/auth/session";
import { wishlistService } from "@/lib/services/wishlist.service";
import { pluralize } from "@/lib/utils/format";

export const metadata: Metadata = { title: "Your wishlist", robots: { index: false } };
export const dynamic = "force-dynamic";

export default async function WishlistPage() {
  const [owner, user] = await Promise.all([getOwner(), getCurrentUser()]);
  const items = await wishlistService.getWishlist(owner);

  return (
    <div className="container py-8 sm:py-12">
      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black tracking-tight sm:text-5xl">
            Your <span className="text-gradient">wishlist</span>
          </h1>
          <p className="mt-2 text-ink-500">
            {items.length > 0 ? `${pluralize(items.length, "item")} saved for later.` : "Save the things you love."}
          </p>
        </div>
        {!user && items.length > 0 && (
          <p className="rounded-2xl bg-[#FEF9EC] px-4 py-3 text-sm text-[#855000] border border-[#FDE1A3]">
            <Link href="/account?next=/wishlist" className="font-bold text-[#855000] hover:underline">
              Sign in
            </Link>{" "}
            to keep your wishlist across devices.
          </p>
        )}
      </div>

      {items.length === 0 ? (
        <EmptyState
          icon={<Heart className="h-9 w-9" />}
          title="No favourites yet"
          description="Tap the heart on any product to save it here for later."
          action={
            <Link href="/products" className={buttonClasses("primary")}>
              Discover products
            </Link>
          }
        />
      ) : (
        <ul className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3 xl:grid-cols-4">
          {items.map(({ product }) => (
            <li key={product.slug} className="group relative flex flex-col rounded-[2rem] border border-[#EDE7D9] bg-white p-2.5 shadow-card transition hover:shadow-card-hover sm:p-3">
              <div className="overflow-hidden rounded-[1.5rem]">
                <ProductArt art={product.art} name={product.name} image={product.images[0]} className="transition-transform duration-700 group-hover:scale-105" />
              </div>
              <div className="flex flex-1 flex-col px-1.5 pt-3 sm:px-2">
                <h2 className="line-clamp-2 text-sm font-bold sm:text-base">
                  <Link href={`/products/${product.slug}`} className="after:absolute after:inset-0 hover:text-[#855000]">
                    {product.name}
                  </Link>
                </h2>
                <Rating value={product.rating} count={product.reviewCount} className="mt-1.5" />
                <Price price={product.price} compareAtPrice={product.compareAtPrice} size="sm" className="mt-2 flex-wrap" />
                <div className="mt-auto">
                  <WishlistActions productSlug={product.slug} productName={product.name} outOfStock={product.stock <= 0} />
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
