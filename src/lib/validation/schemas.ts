import { z } from "zod";
import { MAX_QUANTITY_PER_ITEM } from "@/lib/business/pricing";
import { DEFAULT_PAGE_SIZE } from "@/lib/business/catalog-query";
import { SLUG_PATTERN } from "@/lib/utils/slug";

const slug = z.string().trim().min(1).max(100).regex(SLUG_PATTERN, "Must be a valid slug.");

export const emailSchema = z
  .string({ error: (issue) => (issue.input === undefined ? "Email is required." : "Email must be text.") })
  .trim()
  .toLowerCase()
  .min(1, "Email is required.")
  .max(254, "Email is too long.")
  .pipe(z.email("Enter a valid email address."));

export const passwordSchema = z
  .string({ error: (issue) => (issue.input === undefined ? "Password is required." : "Password must be text.") })
  .min(8, "Password must be at least 8 characters.")
  .max(72, "Password must be at most 72 characters.")
  .regex(/[a-zA-Z]/, "Password must contain a letter.")
  .regex(/[0-9]/, "Password must contain a number.");

export const nameSchema = z
  .string({ error: (issue) => (issue.input === undefined ? "Name is required." : "Name must be text.") })
  .trim()
  .min(2, "Name must be at least 2 characters.")
  .max(60, "Name must be at most 60 characters.");

export const signUpSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  password: passwordSchema,
});

export const signInSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Password is required.").max(72),
});

export const updateProfileSchema = z.object({ name: nameSchema });

export const addToCartSchema = z.object({
  productSlug: slug,
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(1, "Quantity must be at least 1.")
    .max(MAX_QUANTITY_PER_ITEM, `You can add at most ${MAX_QUANTITY_PER_ITEM} of an item.`)
    .default(1),
});

export const updateCartItemSchema = z.object({
  quantity: z.coerce
    .number()
    .int("Quantity must be a whole number.")
    .min(0, "Quantity cannot be negative.")
    .max(MAX_QUANTITY_PER_ITEM, `You can add at most ${MAX_QUANTITY_PER_ITEM} of an item.`),
});

export const wishlistSchema = z.object({ productSlug: slug });

export const newsletterSchema = z.object({ email: emailSchema });

export const slugParamSchema = slug;

const optionalNumber = z.preprocess(
  (v) => (v === "" || v === null || v === undefined ? undefined : v),
  z.coerce.number().nonnegative().optional(),
).catch(undefined); // junk values in the URL are ignored rather than breaking the page

const booleanFlag = z.preprocess(
  (v) => (v === "true" || v === "1" || v === true ? true : undefined),
  z.boolean().optional(),
);

/**
 * Query-string schema for product listing. Prices arrive in whole dollars
 * from the UI and are converted to cents here.
 */
export const productQuerySchema = z
  .object({
    q: z.string().trim().max(100).optional().transform((v) => v || undefined).catch(undefined),
    category: z.preprocess((v) => (v ? v : undefined), slug.optional()).catch(undefined),
    minPrice: optionalNumber,
    maxPrice: optionalNumber,
    minRating: z.preprocess(
      (v) => (v === "" || v === undefined ? undefined : v),
      z.coerce.number().min(0).max(5).optional(),
    ).catch(undefined),
    inStock: booleanFlag,
    onSale: booleanFlag,
    sort: z
      .enum(["featured", "newest", "price-asc", "price-desc", "rating", "name"])
      .catch("featured")
      .default("featured"),
    page: z.coerce.number().int().min(1).catch(1).default(1),
    pageSize: z.coerce.number().int().min(1).max(48).catch(DEFAULT_PAGE_SIZE).default(DEFAULT_PAGE_SIZE),
  })
  .transform((q) => ({
    ...q,
    minPrice: q.minPrice !== undefined ? Math.round(q.minPrice * 100) : undefined,
    maxPrice: q.maxPrice !== undefined ? Math.round(q.maxPrice * 100) : undefined,
  }));

const hexColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Must be a hex colour like #7c3aed.");

/** Admin product input. Prices are in cents. */
export const productInputSchema = z
  .object({
    slug,
    name: z.string().trim().min(2).max(80),
    tagline: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(2000),
    categorySlug: slug,
    price: z.number().int().positive(),
    compareAtPrice: z.number().int().positive().optional(),
    rating: z.number().min(0).max(5).default(0),
    reviewCount: z.number().int().min(0).default(0),
    stock: z.number().int().min(0),
    featured: z.boolean().default(false),
    tags: z.array(z.string().trim().min(1).max(30)).max(12).default([]),
    features: z.array(z.string().trim().min(1).max(120)).max(10).default([]),
    specs: z
      .array(z.object({ label: z.string().trim().min(1).max(40), value: z.string().trim().min(1).max(80) }))
      .max(15)
      .default([]),
    colors: z
      .array(z.object({ name: z.string().trim().min(1).max(30), hex: hexColor }))
      .max(8)
      .default([]),
    art: z.object({ icon: z.string().min(1), from: hexColor, to: hexColor }),
    images: z.array(z.url()).max(8).default([]),
  })
  .refine((p) => p.compareAtPrice === undefined || p.compareAtPrice > p.price, {
    message: "compareAtPrice must be greater than price.",
    path: ["compareAtPrice"],
  });

export const productUpdateSchema = z
  .object({
    name: z.string().trim().min(2).max(80),
    tagline: z.string().trim().min(2).max(120),
    description: z.string().trim().min(10).max(2000),
    price: z.number().int().positive(),
    compareAtPrice: z.number().int().positive().nullable(),
    stock: z.number().int().min(0),
    featured: z.boolean(),
    tags: z.array(z.string().trim().min(1).max(30)).max(12),
  })
  .partial()
  .refine((v) => Object.keys(v).length > 0, { message: "Provide at least one field to update." });

export const checkoutSchema = z.object({
  paymentMethod: z.enum(["stripe", "cod"]),
  customer: z.object({
    name: nameSchema,
    email: emailSchema,
    phone: z.string().trim().min(5, "Phone number is required.").max(25),
  }),
  shippingAddress: z.object({
    addressLine1: z.string().trim().min(3, "Street address is required.").max(120),
    addressLine2: z.string().trim().max(120).optional().or(z.literal("")),
    city: z.string().trim().min(2, "City is required.").max(60),
    state: z.string().trim().min(2, "State or province is required.").max(60),
    postalCode: z.string().trim().min(2, "Postal code is required.").max(20),
    country: z.string().trim().min(2, "Country is required.").max(60).default("US"),
  }),
});

export type SignUpInput = z.infer<typeof signUpSchema>;
export type SignInInput = z.infer<typeof signInSchema>;
export type ProductInput = z.infer<typeof productInputSchema>;
export type ProductUpdateInput = z.infer<typeof productUpdateSchema>;
export type CheckoutInput = z.infer<typeof checkoutSchema>;
