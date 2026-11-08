import type {
  Category as CategoryRow,
  Order as OrderRow,
  OrderItem as OrderItemRow,
  Product as ProductRow,
  User as UserRow,
} from "@/generated/prisma/client";
import type { Art, Category, Order, OrderItem, Product, ProductColor, ProductSpec, User } from "@/types";

/**
 * Convert database rows into the app's domain types. Pages and API responses use
 * these plain objects (ISO date strings, no nulls), never raw Prisma rows.
 */

export function toCategory(row: CategoryRow): Category {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    art: row.art as unknown as Art,
    sortOrder: row.sortOrder,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toProduct(row: ProductRow): Product {
  return {
    slug: row.slug,
    name: row.name,
    tagline: row.tagline,
    description: row.description,
    categorySlug: row.categorySlug,
    price: row.price,
    ...(row.compareAtPrice !== null ? { compareAtPrice: row.compareAtPrice } : {}),
    rating: row.rating,
    reviewCount: row.reviewCount,
    stock: row.stock,
    featured: row.featured,
    tags: row.tags,
    features: row.features,
    specs: row.specs as unknown as ProductSpec[],
    colors: row.colors as unknown as ProductColor[],
    art: row.art as unknown as Art,
    images: row.images,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

export function toUser(row: UserRow): User {
  return {
    id: row.id,
    email: row.email,
    name: row.name,
    role: row.role,
    passwordHash: row.passwordHash,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}

function toOrderItem(row: OrderItemRow): OrderItem {
  return {
    slug: row.productSlug ?? "",
    name: row.name,
    price: row.price,
    quantity: row.quantity,
    lineTotal: row.lineTotal,
    ...(row.art ? { art: row.art as unknown as Art } : {}),
  };
}

export function toOrder(row: OrderRow & { items: OrderItemRow[] }): Order {
  return {
    id: row.id,
    ownerId: row.userId ?? row.guestId ?? "",
    customer: { name: row.customerName, email: row.customerEmail, phone: row.customerPhone },
    shippingAddress: {
      addressLine1: row.addressLine1,
      ...(row.addressLine2 ? { addressLine2: row.addressLine2 } : {}),
      city: row.city,
      state: row.state,
      postalCode: row.postalCode,
      country: row.country,
    },
    items: row.items.map(toOrderItem),
    itemCount: row.itemCount,
    subtotal: row.subtotal,
    shipping: row.shipping,
    savings: row.savings,
    total: row.total,
    paymentMethod: row.paymentMethod,
    paymentStatus: row.paymentStatus,
    status: row.status,
    ...(row.stripeSessionId ? { stripeSessionId: row.stripeSessionId } : {}),
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
}
