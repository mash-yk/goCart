/**
 * Loads the six categories and 36 products from src/data/catalog.ts.
 * Safe to run again: existing rows are updated by slug and user data
 * (accounts, carts, wishlists, orders) is left untouched.
 *
 *   npm run db:seed
 */
import { config } from "dotenv";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient, type Prisma } from "../src/generated/prisma/client";
import { buildSearchText } from "../src/lib/business/catalog-query";
import { categories, products } from "../src/data/catalog";

config({ path: ".env.local", quiet: true });
config({ quiet: true });

const url = process.env.DIRECT_URL || process.env.DATABASE_URL;
if (!url) {
  console.error("DATABASE_URL is not set. Add it to .env.local first (see README).");
  process.exit(1);
}

const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: url }) });
const json = (value: unknown) => value as Prisma.InputJsonValue;

async function main() {
  const categorySlugs = new Set(categories.map((c) => c.slug));
  const orphan = products.find((p) => !categorySlugs.has(p.categorySlug));
  if (orphan) throw new Error(`Product "${orphan.slug}" uses unknown category "${orphan.categorySlug}".`);

  for (const c of categories) {
    const data = { name: c.name, tagline: c.tagline, description: c.description, art: json(c.art), sortOrder: c.sortOrder };
    await prisma.category.upsert({ where: { slug: c.slug }, create: { slug: c.slug, ...data }, update: data });
  }

  for (const p of products) {
    const data = {
      name: p.name,
      tagline: p.tagline,
      description: p.description,
      categorySlug: p.categorySlug,
      price: p.price,
      compareAtPrice: p.compareAtPrice ?? null,
      rating: p.rating,
      reviewCount: p.reviewCount,
      stock: p.stock,
      featured: p.featured,
      tags: p.tags,
      features: p.features,
      specs: json(p.specs),
      colors: json(p.colors),
      art: json(p.art),
      images: p.images,
      searchText: buildSearchText(p),
    };
    await prisma.product.upsert({
      where: { slug: p.slug },
      create: { slug: p.slug, ...data, createdAt: new Date(p.createdAt) },
      update: data,
    });
  }

  console.log(`Seeded ${categories.length} categories and ${products.length} products.`);
}

main()
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exitCode = 1;
  })
  .finally(() => prisma.$disconnect());
