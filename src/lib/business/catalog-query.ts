import type { Paginated, Product, ProductQuery, ProductSort } from "@/types";

export const DEFAULT_PAGE_SIZE = 12;

/** Lower-cases text and strips accents and punctuation, so search ignores them. */
export function normalise(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

/** Splits a search query into normalised words. */
export function searchTerms(query: string | undefined): string[] {
  return query ? normalise(query).split(" ").filter(Boolean) : [];
}

/**
 * The text a product can be found by, stored in the products.search_text column.
 * It holds exactly the fields that searchScore() looks at, so a database match
 * always has a positive relevance score.
 */
export function buildSearchText(
  product: Pick<Product, "name" | "tagline" | "tags" | "categorySlug" | "description">,
): string {
  return [product.name, product.tagline, product.tags.join(" "), product.categorySlug, product.description]
    .map(normalise)
    .join(" ");
}

/** Clamps a requested page into range and works out the row offset. */
export function paginate(total: number, page: number, pageSize: number) {
  const size = Math.max(1, pageSize);
  const totalPages = Math.max(1, Math.ceil(total / size));
  const current = Math.min(Math.max(1, page), totalPages);
  return { page: current, pageSize: size, totalPages, skip: (current - 1) * size };
}

/**
 * Relevance score for a search term. Every word in the query must match
 * somewhere; matches in the name count more than matches in tags or description.
 */
export function searchScore(product: Product, query: string): number {
  const terms = searchTerms(query);
  if (terms.length === 0) return 1;

  const name = normalise(product.name);
  const tagline = normalise(product.tagline);
  const tags = product.tags.map(normalise).join(" ");
  const category = normalise(product.categorySlug);
  const description = normalise(product.description);

  let score = 0;
  for (const term of terms) {
    if (name.split(" ").some((w) => w.startsWith(term))) score += 10;
    else if (name.includes(term)) score += 6;
    else if (tags.includes(term) || category.includes(term)) score += 4;
    else if (tagline.includes(term)) score += 3;
    else if (description.includes(term)) score += 1;
    else return 0; // every term has to match somewhere
  }
  return score;
}

const sorters: Record<ProductSort, (a: Product, b: Product) => number> = {
  featured: (a, b) => Number(b.featured) - Number(a.featured) || b.rating - a.rating,
  newest: (a, b) => b.createdAt.localeCompare(a.createdAt),
  "price-asc": (a, b) => a.price - b.price,
  "price-desc": (a, b) => b.price - a.price,
  rating: (a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount,
  name: (a, b) => a.name.localeCompare(b.name),
};

/**
 * Applies search, filters, sorting and pagination to a list of products in memory.
 * The database does the filtering for listing pages; this is used to rank search
 * results by relevance, which SQL ordering can't express.
 */
export function queryProducts(products: Product[], query: ProductQuery): Paginated<Product> {
  const scored: { product: Product; score: number }[] = [];

  for (const product of products) {
    if (query.category && product.categorySlug !== query.category) continue;
    if (query.minPrice !== undefined && product.price < query.minPrice) continue;
    if (query.maxPrice !== undefined && product.price > query.maxPrice) continue;
    if (query.minRating !== undefined && product.rating < query.minRating) continue;
    if (query.inStock && product.stock <= 0) continue;
    if (query.onSale && !(product.compareAtPrice && product.compareAtPrice > product.price)) continue;

    const score = query.q ? searchScore(product, query.q) : 1;
    if (score > 0) scored.push({ product, score });
  }

  const sorter = sorters[query.sort];
  scored.sort((a, b) => {
    // With a search term and the default sort, the most relevant results come first.
    if (query.q && query.sort === "featured" && b.score !== a.score) return b.score - a.score;
    return sorter(a.product, b.product);
  });

  const total = scored.length;
  const { page, pageSize, totalPages, skip } = paginate(total, query.page, query.pageSize);

  return {
    items: scored.slice(skip, skip + pageSize).map((s) => s.product),
    total,
    page,
    pageSize,
    totalPages,
  };
}

/**
 * Related products: same category first, then products that share tags,
 * ranked by how many tags overlap and then by rating.
 */
export function findRelatedProducts(product: Product, all: Product[], limit = 4): Product[] {
  const tags = new Set(product.tags);
  return all
    .filter((p) => p.slug !== product.slug)
    .map((p) => {
      const sharedTags = p.tags.filter((t) => tags.has(t)).length;
      const sameCategory = p.categorySlug === product.categorySlug ? 5 : 0;
      return { p, score: sameCategory + sharedTags * 2 };
    })
    .filter((x) => x.score > 0)
    .sort((a, b) => b.score - a.score || b.p.rating - a.p.rating)
    .slice(0, limit)
    .map((x) => x.p);
}
