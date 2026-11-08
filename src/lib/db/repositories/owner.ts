import type { Owner } from "@/types";

/** How long anonymous guest carts and wishlists are kept after their last change. */
export const GUEST_RETENTION_DAYS = 30;

export function guestExpiry(from = new Date()): Date {
  return new Date(from.getTime() + GUEST_RETENTION_DAYS * 24 * 60 * 60 * 1000);
}

/**
 * Cart, wishlist and order rows belong to either a signed-in user (user_id) or an
 * anonymous guest (guest_id). These helpers build the matching Prisma filters.
 */
export function ownerWhere(owner: Owner) {
  return owner.kind === "user" ? { userId: owner.id } : { guestId: owner.id };
}

export function ownerProductKey(owner: Owner, productSlug: string) {
  return owner.kind === "user"
    ? { userId_productSlug: { userId: owner.id, productSlug } }
    : { guestId_productSlug: { guestId: owner.id, productSlug } };
}

/** Guest rows get an expiry date that is pushed back on every change; user rows never expire. */
export function ownerExpiry(owner: Owner): Date | null {
  return owner.kind === "guest" ? guestExpiry() : null;
}
