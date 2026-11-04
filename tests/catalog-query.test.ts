import { describe, expect, it } from "vitest";
import { findRelatedProducts, queryProducts, searchScore } from "@/lib/business/catalog-query";
import type { ProductQuery } from "@/types";
import { makeProduct } from "./fixtures";

const base: ProductQuery = { sort: "featured", page: 1, pageSize: 12 };

const headphones = makeProduct({ slug: "pulse", name: "Pulse Pro ANC Headphones", tags: ["wireless", "anc"], price: 24900, compareAtPrice: 29900, rating: 4.8, featured: true });
const earbuds = makeProduct({ slug: "airloop", name: "AirLoop Wireless Earbuds", tags: ["wireless"], price: 12900, rating: 4.6 });
const watch = makeProduct({ slug: "orbit", name: "Orbit Smart Watch", categorySlug: "wearables", tags: ["fitness"], price: 19900, rating: 4.4, stock: 0 });
const lamp = makeProduct({ slug: "halo", name: "Halo Desk Lamp", categorySlug: "workspace", description: "Wireless charging base built in.", price: 7900, rating: 3.9 });
const all = [headphones, earbuds, watch, lamp];

describe("searchScore", () => {
  it("ranks name matches above tag and description matches", () => {
    expect(searchScore(headphones, "headphones")).toBeGreaterThan(searchScore(lamp, "wireless"));
    expect(searchScore(earbuds, "wireless")).toBeGreaterThan(searchScore(headphones, "wireless"));
  });

  it("requires every term to match", () => {
    expect(searchScore(headphones, "pulse headphones")).toBeGreaterThan(0);
    expect(searchScore(headphones, "pulse lamp")).toBe(0);
  });

  it("ignores case and extra whitespace", () => {
    expect(searchScore(watch, "  ORBIT   watch ")).toBeGreaterThan(0);
  });
});

describe("queryProducts", () => {
  it("returns relevance order for searches with the default sort", () => {
    const result = queryProducts(all, { ...base, q: "wireless" });
    expect(result.items.map((p) => p.slug)).toEqual(["airloop", "pulse", "halo"]);
  });

  it("filters by category, price, rating, stock and sale", () => {
    expect(queryProducts(all, { ...base, category: "audio" }).total).toBe(2);
    expect(queryProducts(all, { ...base, minPrice: 10000, maxPrice: 20000 }).items.map((p) => p.slug).sort()).toEqual(["airloop", "orbit"]);
    expect(queryProducts(all, { ...base, minRating: 4.5 }).total).toBe(2);
    expect(queryProducts(all, { ...base, inStock: true }).items.some((p) => p.slug === "orbit")).toBe(false);
    expect(queryProducts(all, { ...base, onSale: true }).items.map((p) => p.slug)).toEqual(["pulse"]);
  });

  it("sorts by price and name", () => {
    expect(queryProducts(all, { ...base, sort: "price-asc" }).items[0]?.slug).toBe("halo");
    expect(queryProducts(all, { ...base, sort: "price-desc" }).items[0]?.slug).toBe("pulse");
    expect(queryProducts(all, { ...base, sort: "name" }).items.map((p) => p.slug)).toEqual(["airloop", "halo", "orbit", "pulse"]);
  });

  it("paginates and clamps out-of-range pages", () => {
    const page2 = queryProducts(all, { ...base, sort: "name", pageSize: 3, page: 2 });
    expect(page2.items.map((p) => p.slug)).toEqual(["pulse"]);
    expect(page2.totalPages).toBe(2);
    expect(queryProducts(all, { ...base, pageSize: 3, page: 99 }).page).toBe(2);
  });

  it("returns an empty first page when nothing matches", () => {
    const result = queryProducts(all, { ...base, q: "toaster" });
    expect(result).toMatchObject({ items: [], total: 0, page: 1, totalPages: 1 });
  });
});

describe("findRelatedProducts", () => {
  it("prefers the same category, then shared tags, and never includes the product itself", () => {
    const related = findRelatedProducts(headphones, all, 4).map((p) => p.slug);
    expect(related[0]).toBe("airloop");
    expect(related).not.toContain("pulse");
    expect(related).not.toContain("orbit"); // nothing in common
  });
});
