import type { Metadata } from "next";
import { AdminProductsView } from "@/components/admin/admin-products-view";
import { catalogService } from "@/lib/services/catalog.service";

export const metadata: Metadata = {
  title: "Manage products",
};

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const [categories, products] = await Promise.all([
    catalogService.getCategories(),
    catalogService.searchProducts({ sort: "newest", page: 1, pageSize: 500 }),
  ]);

  return <AdminProductsView initialProducts={products.items} categories={categories} />;
}

