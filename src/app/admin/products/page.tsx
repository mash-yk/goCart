import type { Metadata } from "next";
import { AdminProductsView } from "@/components/admin/admin-products-view";
import { categories as defaultCategories, products as defaultProducts } from "@/data/catalog";
import { catalogService } from "@/lib/services/catalog.service";
import type { Category, Product } from "@/types";

export const metadata: Metadata = {
  title: "Manage Products | Lumora Admin",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  let categories: Category[] = [];
  let products: Product[] = [];

  try {
    const [cats, prodsRes] = await Promise.all([
      catalogService.getCategories(),
      catalogService.searchProducts({
        sort: "newest",
        page: 1,
        pageSize: 100,
      }),
    ]);
    categories = cats;
    products = prodsRes.items;
  } catch (err) {
    console.warn("[admin.products] DB offline or unseeded, falling back to seed catalog for display:", err);
    categories = defaultCategories;
    products = defaultProducts;
  }

  return <AdminProductsView initialProducts={products} categories={categories} />;
}

