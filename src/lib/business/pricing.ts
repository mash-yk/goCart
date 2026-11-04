import type { CartLine, CartTotals, Product } from "@/types";

/** Customers can add at most this many units of a single product. */
export const MAX_QUANTITY_PER_ITEM = 10;
/** Orders at or above this subtotal (cents) ship free. */
export const FREE_SHIPPING_THRESHOLD = 7500;
/** Flat shipping fee (cents) below the free-shipping threshold. */
export const FLAT_SHIPPING_FEE = 699;

/** Highest quantity allowed for a product, limited by stock and the per-item cap. */
export function maxAllowedQuantity(product: Pick<Product, "stock">): number {
  return Math.max(0, Math.min(product.stock, MAX_QUANTITY_PER_ITEM));
}

export function buildCartLine(product: Product, quantity: number): CartLine {
  return {
    product,
    quantity,
    lineTotal: product.price * quantity,
    maxQuantity: maxAllowedQuantity(product),
  };
}

/** Calculates subtotal, savings, shipping and total for a set of cart lines. All values are cents. */
export function calculateCartTotals(lines: Pick<CartLine, "product" | "quantity">[]): CartTotals {
  let subtotal = 0;
  let savings = 0;
  let itemCount = 0;

  for (const { product, quantity } of lines) {
    subtotal += product.price * quantity;
    itemCount += quantity;
    if (product.compareAtPrice && product.compareAtPrice > product.price) {
      savings += (product.compareAtPrice - product.price) * quantity;
    }
  }

  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;
  const shipping = itemCount === 0 || qualifiesForFreeShipping ? 0 : FLAT_SHIPPING_FEE;

  return {
    itemCount,
    subtotal,
    savings,
    shipping,
    total: subtotal + shipping,
    freeShippingRemaining: itemCount === 0 || qualifiesForFreeShipping ? 0 : FREE_SHIPPING_THRESHOLD - subtotal,
  };
}

/** Percentage discount between the original and sale price, rounded to a whole number. */
export function discountPercent(product: Pick<Product, "price" | "compareAtPrice">): number {
  if (!product.compareAtPrice || product.compareAtPrice <= product.price) return 0;
  return Math.round(((product.compareAtPrice - product.price) / product.compareAtPrice) * 100);
}

/**
 * Combines two quantities for the same product (e.g. when a guest cart is merged
 * into a user's cart at sign-in) without exceeding what is allowed.
 */
export function mergeQuantities(a: number, b: number, product: Pick<Product, "stock">): number {
  return Math.min(a + b, maxAllowedQuantity(product));
}
