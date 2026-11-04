import "server-only";
import { productRepository } from "@/lib/db/repositories/product.repository";
import { wishlistRepository } from "@/lib/db/repositories/wishlist.repository";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { Owner, WishlistEntry } from "@/types";

export const wishlistService = {
  async getWishlist(owner: Owner | null): Promise<WishlistEntry[]> {
    if (!owner) return [];
    const items = await wishlistRepository.list(owner);
    if (items.length === 0) return [];
    const products = await productRepository.getManyBySlugs(items.map((i) => i.productSlug));
    const entries: WishlistEntry[] = [];
    for (const item of items) {
      const product = products.get(item.productSlug);
      if (product) entries.push({ product, addedAt: item.addedAt });
      else await wishlistRepository.remove(owner, item.productSlug); // product was deleted
    }
    return entries;
  },

  async getProductSlugs(owner: Owner | null): Promise<string[]> {
    if (!owner) return [];
    return (await wishlistRepository.list(owner)).map((i) => i.productSlug);
  },

  /** Adds a product. Duplicates are rejected with a 409 so the client can stay in sync. */
  async add(owner: Owner, productSlug: string): Promise<void> {
    const product = await productRepository.getBySlug(productSlug);
    if (!product) throw new NotFoundError("Product");
    const added = await wishlistRepository.add(owner, productSlug);
    if (!added) throw new ConflictError("ALREADY_IN_WISHLIST", `${product.name} is already in your wishlist.`);
  },

  async remove(owner: Owner, productSlug: string): Promise<void> {
    await wishlistRepository.remove(owner, productSlug);
  },

  /** Moves a guest wishlist into the user's wishlist at sign-in (duplicates are skipped). */
  async mergeGuestWishlist(guest: Owner, user: Owner): Promise<void> {
    const items = await wishlistRepository.list(guest);
    for (const item of items) {
      await wishlistRepository.add(user, item.productSlug, item.addedAt);
    }
    if (items.length) await wishlistRepository.clear(guest);
  },
};
