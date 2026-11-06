import type { MetadataRoute } from "next";
import { catalogService } from "@/lib/services/catalog.service";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base: MetadataRoute.Sitemap = [
    { url: siteUrl, changeFrequency: "daily", priority: 1 },
    { url: `${siteUrl}/products`, changeFrequency: "daily", priority: 0.9 },
  ];
  try {
    const [categories, products] = await Promise.all([
      catalogService.getCategories(),
      catalogService.searchProducts({ sort: "newest", page: 1, pageSize: 1000 }),
    ]);
    return [
      ...base,
      ...categories.map((c) => ({ url: `${siteUrl}/categories/${c.slug}`, lastModified: c.updatedAt, priority: 0.8 })),
      ...products.items.map((p) => ({ url: `${siteUrl}/products/${p.slug}`, lastModified: p.updatedAt, priority: 0.7 })),
    ];
  } catch {
    return base;
  }
}
