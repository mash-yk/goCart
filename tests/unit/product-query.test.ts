import { describe, expect, it } from "vitest";
import { buildSearchText, paginate, searchScore, searchTerms } from "@/lib/business/catalog-query";
import { buildProductWhere, PRODUCT_ORDER_BY } from "@/lib/db/product-query";
import { makeProduct } from "./fixtures";

describe("buildProductWhere", () => {
  it("returns an empty filter when nothing is selected", () => {
    expect(buildProductWhere({})).toEqual({});
  });

  it("combines every filter with AND", () => {
    expect(
      buildProductWhere({ category: "audio", minPrice: 1000, maxPrice: 5000, minRating: 4, inStock: true, onSale: true }),
    ).toEqual({
      AND: [
        { categorySlug: "audio" },
        { price: { gte: 1000, lte: 5000 } },
        { rating: { gte: 4 } },
        { stock: { gt: 0 } },
        { compareAtPrice: { not: null } },
      ],
    });
  });

  it("requires every search word to appear in the search text", () => {
    expect(buildProductWhere({ q: "  Noise-Cancelling HEADPHONES! " })).toEqual({
      AND: [{ searchText: { contains: "noise-cancelling" } }, { searchText: { contains: "headphones" } }],
    });
  });

  it("has a stable order for every sort option", () => {
    for (const order of Object.values(PRODUCT_ORDER_BY)) {
      expect(order.at(-1)).toEqual({ slug: "asc" });
    }
  });
});

describe("search text", () => {
  it("normalises words the same way as the search box", () => {
    expect(searchTerms("Café  Lamp")).toEqual(["cafe", "lamp"]);
    expect(searchTerms(undefined)).toEqual([]);
  });

  it("contains every field searchScore looks at, so database matches always score above zero", () => {
    const product = makeProduct({
      name: "Halo Desk Lamp",
      tagline: "Light that follows you",
      tags: ["smart-home"],
      categorySlug: "workspace",
      description: "Wireless charging base built in.",
    });
    const text = buildSearchText(product);
    for (const word of ["halo", "follows", "smart-home", "workspace", "charging"]) {
      expect(text).toContain(word);
      expect(searchScore(product, word)).toBeGreaterThan(0);
    }
  });
});

describe("paginate", () => {
  it("works out the offset and clamps out-of-range pages", () => {
    expect(paginate(30, 2, 12)).toEqual({ page: 2, pageSize: 12, totalPages: 3, skip: 12 });
    expect(paginate(30, 99, 12).page).toBe(3);
    expect(paginate(0, 5, 12)).toEqual({ page: 1, pageSize: 12, totalPages: 1, skip: 0 });
  });
});
