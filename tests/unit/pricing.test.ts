import { describe, expect, it } from "vitest";
import {
  buildCartLine,
  calculateCartTotals,
  discountPercent,
  FLAT_SHIPPING_FEE,
  FREE_SHIPPING_THRESHOLD,
  MAX_QUANTITY_PER_ITEM,
  maxAllowedQuantity,
  mergeQuantities,
} from "@/lib/business/pricing";
import { makeProduct } from "./fixtures";

describe("calculateCartTotals", () => {
  it("returns zeros for an empty cart, with no shipping fee", () => {
    expect(calculateCartTotals([])).toEqual({
      itemCount: 0,
      subtotal: 0,
      savings: 0,
      shipping: 0,
      total: 0,
      freeShippingRemaining: 0,
    });
  });

  it("adds a flat shipping fee below the free-shipping threshold", () => {
    const totals = calculateCartTotals([{ product: makeProduct({ price: 2000 }), quantity: 2 }]);
    expect(totals.subtotal).toBe(4000);
    expect(totals.itemCount).toBe(2);
    expect(totals.shipping).toBe(FLAT_SHIPPING_FEE);
    expect(totals.total).toBe(4000 + FLAT_SHIPPING_FEE);
    expect(totals.freeShippingRemaining).toBe(FREE_SHIPPING_THRESHOLD - 4000);
  });

  it("ships free at exactly the threshold", () => {
    const totals = calculateCartTotals([{ product: makeProduct({ price: FREE_SHIPPING_THRESHOLD }), quantity: 1 }]);
    expect(totals.shipping).toBe(0);
    expect(totals.freeShippingRemaining).toBe(0);
    expect(totals.total).toBe(FREE_SHIPPING_THRESHOLD);
  });

  it("counts savings only for products on sale", () => {
    const totals = calculateCartTotals([
      { product: makeProduct({ price: 8000, compareAtPrice: 10000 }), quantity: 2 },
      { product: makeProduct({ price: 500 }), quantity: 1 },
    ]);
    expect(totals.savings).toBe(4000);
    expect(totals.subtotal).toBe(16500);
  });
});

describe("quantity limits", () => {
  it("limits quantity by stock and by the per-item cap", () => {
    expect(maxAllowedQuantity({ stock: 3 })).toBe(3);
    expect(maxAllowedQuantity({ stock: 500 })).toBe(MAX_QUANTITY_PER_ITEM);
    expect(maxAllowedQuantity({ stock: 0 })).toBe(0);
    expect(maxAllowedQuantity({ stock: -2 })).toBe(0);
  });

  it("merges guest and account quantities without going over the limit", () => {
    expect(mergeQuantities(2, 3, { stock: 50 })).toBe(5);
    expect(mergeQuantities(8, 8, { stock: 50 })).toBe(MAX_QUANTITY_PER_ITEM);
    expect(mergeQuantities(2, 3, { stock: 4 })).toBe(4);
  });

  it("builds a cart line with its total and maximum", () => {
    const line = buildCartLine(makeProduct({ price: 1250, stock: 6 }), 3);
    expect(line.lineTotal).toBe(3750);
    expect(line.maxQuantity).toBe(6);
  });
});

describe("discountPercent", () => {
  it("rounds to a whole percentage", () => {
    expect(discountPercent({ price: 7999, compareAtPrice: 9999 })).toBe(20);
  });
  it("is zero when there is no valid sale price", () => {
    expect(discountPercent({ price: 1000 })).toBe(0);
    expect(discountPercent({ price: 1000, compareAtPrice: 900 })).toBe(0);
  });
});
