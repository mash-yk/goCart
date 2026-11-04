import { describe, expect, it } from "vitest";
import { ValidationError } from "@/lib/errors";
import { parseInput } from "@/lib/validation/parse";
import { addToCartSchema, productQuerySchema, signUpSchema, updateCartItemSchema } from "@/lib/validation/schemas";

describe("signUpSchema", () => {
  it("normalises the email and trims the name", () => {
    const parsed = signUpSchema.parse({ name: "  Ada Lovelace ", email: " ADA@Example.COM ", password: "engine123" });
    expect(parsed).toEqual({ name: "Ada Lovelace", email: "ada@example.com", password: "engine123" });
  });

  it("rejects weak passwords", () => {
    expect(signUpSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "short1" }).success).toBe(false);
    expect(signUpSchema.safeParse({ name: "Ada", email: "ada@example.com", password: "nodigitshere" }).success).toBe(false);
  });
});

describe("parseInput", () => {
  it("throws a ValidationError with one message per field", () => {
    try {
      parseInput(signUpSchema, { name: "A", email: "nope", password: "" });
      expect.unreachable();
    } catch (error) {
      expect(error).toBeInstanceOf(ValidationError);
      const details = (error as ValidationError).details as { fieldErrors: Record<string, string> };
      expect(Object.keys(details.fieldErrors).sort()).toEqual(["email", "name", "password"]);
    }
  });
});

describe("cart schemas", () => {
  it("defaults quantity to 1 and rejects bad slugs", () => {
    expect(addToCartSchema.parse({ productSlug: "pulse-pro" }).quantity).toBe(1);
    expect(addToCartSchema.safeParse({ productSlug: "../etc/passwd" }).success).toBe(false);
  });

  it("allows 0 (remove) to 10 when updating", () => {
    expect(updateCartItemSchema.safeParse({ quantity: 0 }).success).toBe(true);
    expect(updateCartItemSchema.safeParse({ quantity: 11 }).success).toBe(false);
    expect(updateCartItemSchema.safeParse({ quantity: 1.5 }).success).toBe(false);
  });
});

describe("productQuerySchema", () => {
  it("converts dollar prices from the URL into cents", () => {
    const q = productQuerySchema.parse({ minPrice: "50", maxPrice: "149.99" });
    expect(q.minPrice).toBe(5000);
    expect(q.maxPrice).toBe(14999);
  });

  it("falls back to safe defaults for junk values", () => {
    const q = productQuerySchema.parse({ sort: "hacker", page: "-4", pageSize: "9999" });
    expect(q).toMatchObject({ sort: "featured", page: 1, pageSize: 12 });
  });

  it("reads boolean flags from query strings", () => {
    const q = productQuerySchema.parse({ inStock: "true", onSale: "false" });
    expect(q.inStock).toBe(true);
    expect(q.onSale).toBeFalsy();
  });
});

describe("productQuerySchema with junk input", () => {
  it("ignores invalid filters instead of failing", () => {
    const q = productQuerySchema.parse({ minPrice: "abc", maxPrice: "-5", minRating: "9", category: "Not A Slug!", q: "x".repeat(300) });
    expect(q).toMatchObject({ minPrice: undefined, maxPrice: undefined, minRating: undefined, category: undefined, q: undefined });
  });
});
