/**
 * Shared domain types used across the UI, API layer, services and repositories.
 * Money is always stored as integer cents to avoid floating-point rounding errors.
 */

export type ArtIcon =
  | "headphones"
  | "speaker"
  | "mic"
  | "audio"
  | "watch"
  | "heart-pulse"
  | "activity"
  | "smartphone"
  | "lamp"
  | "lightbulb"
  | "plug"
  | "thermometer"
  | "camera"
  | "router"
  | "keyboard"
  | "mouse"
  | "monitor"
  | "laptop"
  | "pen"
  | "notebook"
  | "backpack"
  | "luggage"
  | "briefcase"
  | "glasses"
  | "wallet"
  | "plane"
  | "dumbbell"
  | "bike"
  | "footprints"
  | "bottle"
  | "coffee"
  | "flame"
  | "shirt"
  | "gamepad"
  | "tent"
  | "umbrella"
  | "sun"
  | "fan"
  | "battery"
  | "projector"
  | "webcam"
  | "leaf"
  | "sparkles";

/** Visual definition used to render generated product / category artwork. */
export interface Art {
  icon: ArtIcon;
  /** Gradient start colour (hex). */
  from: string;
  /** Gradient end colour (hex). */
  to: string;
}

export interface Category {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  art: Art;
  sortOrder: number;
  createdAt: string;
  updatedAt: string;
}

export interface ProductSpec {
  label: string;
  value: string;
}

export interface ProductColor {
  name: string;
  hex: string;
}

export interface Product {
  /** URL-safe unique identifier, also used as the product id. */
  slug: string;
  name: string;
  tagline: string;
  description: string;
  categorySlug: string;
  /** Price in cents. */
  price: number;
  /** Original price in cents when the product is on sale. */
  compareAtPrice?: number;
  rating: number;
  reviewCount: number;
  stock: number;
  featured: boolean;
  tags: string[];
  features: string[];
  specs: ProductSpec[];
  colors: ProductColor[];
  art: Art;
  /** Optional real photo URLs; when empty the generated art is shown. */
  images: string[];
  createdAt: string;
  updatedAt: string;
}

export type UserRole = "customer" | "admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  passwordHash: string;
  createdAt: string;
  updatedAt: string;
}

export type PublicUser = Omit<User, "passwordHash">;

export interface CartItem {
  productSlug: string;
  quantity: number;
  addedAt: string;
  updatedAt: string;
}

export interface CartLine {
  product: Product;
  quantity: number;
  /** Line total in cents. */
  lineTotal: number;
  /** Highest quantity the customer may set for this line. */
  maxQuantity: number;
}

export interface CartTotals {
  itemCount: number;
  subtotal: number;
  savings: number;
  shipping: number;
  total: number;
  /** Cents remaining until free shipping (0 when already qualified). */
  freeShippingRemaining: number;
}

export interface Cart extends CartTotals {
  lines: CartLine[];
}

export interface WishlistItem {
  productSlug: string;
  addedAt: string;
}

export interface WishlistEntry {
  product: Product;
  addedAt: string;
}

export type ProductSort = "featured" | "newest" | "price-asc" | "price-desc" | "rating" | "name";

export interface ProductQuery {
  q?: string;
  category?: string;
  minPrice?: number;
  maxPrice?: number;
  minRating?: number;
  inStock?: boolean;
  onSale?: boolean;
  sort: ProductSort;
  page: number;
  pageSize: number;
}

export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

/** Shape of every error returned by the API layer. */
export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

/** Identity that owns a cart or wishlist: a signed-in user or an anonymous guest. */
export interface Owner {
  id: string;
  kind: "user" | "guest";
}

export type PaymentMethod = "stripe" | "cod";
export type PaymentStatus = "paid" | "pending_cod" | "pending_payment" | "failed";
export type OrderStatus = "confirmed" | "processing" | "shipped" | "delivered" | "cancelled";

export interface CustomerInfo {
  name: string;
  email: string;
  phone: string;
}

export interface ShippingAddress {
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
}

export interface OrderItem {
  slug: string;
  name: string;
  price: number;
  quantity: number;
  lineTotal: number;
  art?: Art;
}

export interface Order {
  id: string;
  ownerId: string;
  customer: CustomerInfo;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  itemCount: number;
  subtotal: number;
  shipping: number;
  savings: number;
  total: number;
  paymentMethod: PaymentMethod;
  paymentStatus: PaymentStatus;
  status: OrderStatus;
  stripeSessionId?: string;
  createdAt: string;
  updatedAt: string;
}
