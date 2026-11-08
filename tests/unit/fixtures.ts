import type { Product } from "@/types";

let counter = 0;

/** Builds a valid product for tests; override only the fields a test cares about. */
export function makeProduct(overrides: Partial<Product> = {}): Product {
  counter++;
  return {
    slug: `product-${counter}`,
    name: `Product ${counter}`,
    tagline: "A test product",
    description: "Used in unit tests.",
    categorySlug: "audio",
    price: 1000,
    rating: 4,
    reviewCount: 10,
    stock: 20,
    featured: false,
    tags: [],
    features: [],
    specs: [],
    colors: [],
    art: { icon: "headphones", from: "#7c3aed", to: "#fb923c" },
    images: [],
    createdAt: "2026-11-01T00:00:00.000Z",
    updatedAt: "2026-11-01T00:00:00.000Z",
    ...overrides,
  };
}
