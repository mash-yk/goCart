import { randomUUID } from "node:crypto";
import { beforeAll, describe, expect, it } from "vitest";
import { db } from "@/lib/db/client";
import { cartRepository } from "@/lib/db/repositories/cart.repository";
import { productRepository } from "@/lib/db/repositories/product.repository";
import { userRepository } from "@/lib/db/repositories/user.repository";
import { wishlistRepository } from "@/lib/db/repositories/wishlist.repository";
import type { Owner } from "@/types";
import { resetDatabase } from "./helpers";

const newUser = (email: string) => ({
  id: randomUUID(),
  email,
  name: "Test User",
  role: "customer" as const,
  passwordHash: "$2b$10$hash",
});
const guest = (): Owner => ({ id: `guest-${randomUUID()}`, kind: "guest" });

describe("users", () => {
  beforeAll(resetDatabase);

  it("creates a user and finds them by email", async () => {
    const user = await userRepository.create(newUser("ada@example.com"));
    expect((await userRepository.getByEmail("ADA@example.com"))?.id).toBe(user.id);
  });

  it("rejects a second account with the same email", async () => {
    await expect(userRepository.create(newUser("ada@example.com"))).rejects.toMatchObject({
      status: 409,
      code: "EMAIL_TAKEN",
    });
  });

  it("deletes a user's cart and wishlist with the account", async () => {
    const user = await userRepository.create(newUser("leaving@example.com"));
    const owner: Owner = { id: user.id, kind: "user" };
    await cartRepository.setQuantity(owner, "pulse-pro-anc-headphones", 1);
    await wishlistRepository.add(owner, "pulse-pro-anc-headphones");
    await userRepository.delete(user);
    expect(await db().cartItem.count({ where: { userId: user.id } })).toBe(0);
    expect(await db().wishlistItem.count({ where: { userId: user.id } })).toBe(0);
  });
});

describe("carts", () => {
  beforeAll(resetDatabase);

  it("keeps one line per product and updates its quantity", async () => {
    const owner = guest();
    await cartRepository.setQuantity(owner, "glide-wireless-mouse", 1);
    await cartRepository.setQuantity(owner, "glide-wireless-mouse", 3);
    const items = await cartRepository.list(owner);
    expect(items).toHaveLength(1);
    expect(items[0]?.quantity).toBe(3);
  });

  it("gives guest lines an expiry date and user lines none", async () => {
    const g = guest();
    await cartRepository.setQuantity(g, "glide-wireless-mouse", 1);
    const row = await db().cartItem.findFirstOrThrow({ where: { guestId: g.id } });
    expect(row.expiresAt!.getTime()).toBeGreaterThan(Date.now() + 29 * 24 * 3600 * 1000);
  });

  it("keeps different owners' carts apart and clears only one", async () => {
    const a = guest();
    const b = guest();
    await cartRepository.setQuantity(a, "glide-wireless-mouse", 1);
    await cartRepository.setQuantity(b, "glide-wireless-mouse", 2);
    await cartRepository.clear(a);
    expect(await cartRepository.list(a)).toEqual([]);
    expect((await cartRepository.list(b))[0]?.quantity).toBe(2);
  });

  it("removes cart lines when their product is deleted", async () => {
    const owner = guest();
    await cartRepository.setQuantity(owner, "wave-home-smart-speaker", 1);
    await productRepository.delete("wave-home-smart-speaker");
    expect(await cartRepository.list(owner)).toEqual([]);
  });
});

describe("wishlists", () => {
  beforeAll(resetDatabase);

  it("blocks duplicates at the database level", async () => {
    const owner = guest();
    expect(await wishlistRepository.add(owner, "airloop-wireless-earbuds")).toBe(true);
    expect(await wishlistRepository.add(owner, "airloop-wireless-earbuds")).toBe(false);
    expect(await wishlistRepository.list(owner)).toHaveLength(1);
  });
});
