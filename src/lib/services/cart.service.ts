import "server-only";
import { cartRepository } from "@/lib/db/repositories/cart.repository";
import { productRepository } from "@/lib/db/repositories/product.repository";
import {
  buildCartLine,
  calculateCartTotals,
  maxAllowedQuantity,
  mergeQuantities,
} from "@/lib/business/pricing";
import { ConflictError, NotFoundError } from "@/lib/errors";
import type { Cart, Owner } from "@/types";

const EMPTY_CART: Cart = {
  lines: [],
  itemCount: 0,
  subtotal: 0,
  savings: 0,
  shipping: 0,
  total: 0,
  freeShippingRemaining: 0,
};

export const cartService = {
  /**
   * Loads the cart and joins each line with current product data, so prices and
   * stock are always up to date. Lines for deleted products are removed, and
   * quantities above the current stock are reduced.
   */
  async getCart(owner: Owner | null): Promise<Cart> {
    if (!owner) return EMPTY_CART;
    const items = await cartRepository.list(owner);
    if (items.length === 0) return EMPTY_CART;

    const products = await productRepository.getManyBySlugs(items.map((i) => i.productSlug));
    const lines = [];

    for (const item of items) {
      const product = products.get(item.productSlug);
      if (!product) {
        await cartRepository.remove(owner, item.productSlug);
        continue;
      }
      const max = maxAllowedQuantity(product);
      if (max === 0) {
        lines.push(buildCartLine(product, item.quantity)); // shown as out of stock
        continue;
      }
      const quantity = Math.min(item.quantity, max);
      if (quantity !== item.quantity) {
        await cartRepository.setQuantity(owner, item.productSlug, quantity, item.addedAt);
      }
      lines.push(buildCartLine(product, quantity));
    }

    const purchasable = lines.filter((l) => l.maxQuantity > 0);
    return { lines, ...calculateCartTotals(purchasable) };
  },

  async getItemCount(owner: Owner | null): Promise<number> {
    if (!owner) return 0;
    const items = await cartRepository.list(owner);
    return items.reduce((sum, i) => sum + i.quantity, 0);
  },

  /** Adds units of a product. If it's already in the cart, the quantities are combined. */
  async addItem(owner: Owner, productSlug: string, quantity: number): Promise<Cart> {
    const product = await productRepository.getBySlug(productSlug);
    if (!product) throw new NotFoundError("Product");

    const max = maxAllowedQuantity(product);
    if (max === 0) throw new ConflictError("OUT_OF_STOCK", `${product.name} is out of stock.`);

    const existing = await cartRepository.get(owner, productSlug);
    const current = existing?.quantity ?? 0;
    if (current >= max) {
      throw new ConflictError(
        "QUANTITY_LIMIT",
        `You already have the maximum quantity (${max}) of ${product.name} in your cart.`,
      );
    }
    const next = Math.min(current + quantity, max);
    await cartRepository.setQuantity(owner, productSlug, next, existing?.addedAt);
    return this.getCart(owner);
  },

  /** Sets an exact quantity. A quantity of 0 removes the line. */
  async updateQuantity(owner: Owner, productSlug: string, quantity: number): Promise<Cart> {
    const existing = await cartRepository.get(owner, productSlug);
    if (!existing) throw new NotFoundError("Cart item");

    if (quantity === 0) {
      await cartRepository.remove(owner, productSlug);
      return this.getCart(owner);
    }

    const product = await productRepository.getBySlug(productSlug);
    if (!product) {
      await cartRepository.remove(owner, productSlug);
      throw new NotFoundError("Product", "This product is no longer available and was removed from your cart.");
    }
    const max = maxAllowedQuantity(product);
    if (quantity > max) {
      throw new ConflictError(
        "QUANTITY_LIMIT",
        max === 0 ? `${product.name} is out of stock.` : `Only ${max} of ${product.name} can be ordered.`,
        { maxQuantity: max },
      );
    }
    await cartRepository.setQuantity(owner, productSlug, quantity, existing.addedAt);
    return this.getCart(owner);
  },

  async removeItem(owner: Owner, productSlug: string): Promise<Cart> {
    await cartRepository.remove(owner, productSlug);
    return this.getCart(owner);
  },

  async clear(owner: Owner): Promise<void> {
    await cartRepository.clear(owner);
  },

  /** Moves a guest cart into a user's cart at sign-in, combining duplicate products. */
  async mergeGuestCart(guest: Owner, user: Owner): Promise<void> {
    const guestItems = await cartRepository.list(guest);
    if (guestItems.length === 0) return;

    const [userItems, products] = await Promise.all([
      cartRepository.list(user),
      productRepository.getManyBySlugs(guestItems.map((i) => i.productSlug)),
    ]);
    const userQuantities = new Map(userItems.map((i) => [i.productSlug, i]));

    for (const item of guestItems) {
      const product = products.get(item.productSlug);
      if (!product || maxAllowedQuantity(product) === 0) continue;
      const existing = userQuantities.get(item.productSlug);
      const quantity = mergeQuantities(existing?.quantity ?? 0, item.quantity, product);
      await cartRepository.setQuantity(user, item.productSlug, quantity, existing?.addedAt ?? item.addedAt);
    }
    await cartRepository.clear(guest);
  },
};
