/**
 * Single-table key design for the `lumora-store` table.
 *
 * | Entity        | PK                 | SK                     | GSI1PK              | GSI1SK             | GSI2PK     | GSI2SK                 |
 * |---------------|--------------------|------------------------|---------------------|--------------------|------------|------------------------|
 * | Category      | CATEGORY           | CATEGORY#<slug>        |                     |                    |            |                        |
 * | Product       | PRODUCT#<slug>     | PRODUCT                | CATEGORY#<slug>     | PRODUCT#<slug>     | PRODUCTS   | <createdAt>#<slug>     |
 * | User          | USER#<id>          | PROFILE                |                     |                    |            |                        |
 * | Email lookup  | EMAIL#<email>      | EMAIL                  |                     |                    |            |                        |
 * | Cart item     | OWNER#<ownerId>    | CART#<productSlug>     |                     |                    |            |                        |
 * | Wishlist item | OWNER#<ownerId>    | WISHLIST#<productSlug> |                     |                    |            |                        |
 * | Subscriber    | NEWSLETTER         | EMAIL#<email>          |                     |                    |            |                        |
 *
 * See docs/DATABASE.md for the full list of access patterns.
 */
export const keys = {
  category: (slug: string) => ({ PK: "CATEGORY", SK: `CATEGORY#${slug}` }),
  categoryPartition: "CATEGORY",

  product: (slug: string) => ({ PK: `PRODUCT#${slug}`, SK: "PRODUCT" }),
  productGsi1: (categorySlug: string, slug: string) => ({
    GSI1PK: `CATEGORY#${categorySlug}`,
    GSI1SK: `PRODUCT#${slug}`,
  }),
  productGsi2: (createdAt: string, slug: string) => ({
    GSI2PK: "PRODUCTS",
    GSI2SK: `${createdAt}#${slug}`,
  }),
  allProductsPartition: "PRODUCTS",
  categoryProductsPartition: (categorySlug: string) => `CATEGORY#${categorySlug}`,

  user: (id: string) => ({ PK: `USER#${id}`, SK: "PROFILE" }),
  email: (email: string) => ({ PK: `EMAIL#${email.toLowerCase()}`, SK: "EMAIL" }),

  owner: (ownerId: string) => `OWNER#${ownerId}`,
  cartItem: (ownerId: string, productSlug: string) => ({
    PK: `OWNER#${ownerId}`,
    SK: `CART#${productSlug}`,
  }),
  cartPrefix: "CART#",
  wishlistItem: (ownerId: string, productSlug: string) => ({
    PK: `OWNER#${ownerId}`,
    SK: `WISHLIST#${productSlug}`,
  }),
  wishlistPrefix: "WISHLIST#",

  subscriber: (email: string) => ({ PK: "NEWSLETTER", SK: `EMAIL#${email.toLowerCase()}` }),
} as const;

/** Names of the global secondary indexes on the table. */
export const indexes = {
  byCategory: "GSI1",
  allProducts: "GSI2",
} as const;

/** Guest carts and wishlists expire automatically through DynamoDB TTL after 30 days. */
export const GUEST_TTL_SECONDS = 60 * 60 * 24 * 30;

export function guestExpiry(now = Date.now()): number {
  return Math.floor(now / 1000) + GUEST_TTL_SECONDS;
}
