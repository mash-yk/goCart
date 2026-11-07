"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ExternalLink,
  Pencil,
  Plus,
  Search,
  Sparkles,
  Star,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { ProductArt } from "@/components/art/product-art";
import { ProductFormModal } from "@/components/admin/product-form-modal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { formatPrice } from "@/lib/utils/format";
import type { Category, Product } from "@/types";

export function AdminProductsView({
  initialProducts,
  categories,
}: {
  initialProducts: Product[];
  categories: Category[];
}) {
  const [products, setProducts] = useState<Product[]>(initialProducts);
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [stockFilter, setStockFilter] = useState("all");

  // Modal states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);

  // Delete states
  const [deletingProduct, setDeletingProduct] = useState<Product | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Filtered products calculation
  const filtered = useMemo(() => {
    return products.filter((p) => {
      if (categoryFilter !== "all" && p.categorySlug !== categoryFilter) {
        return false;
      }
      if (stockFilter === "in-stock" && p.stock <= 0) {
        return false;
      }
      if (stockFilter === "out-of-stock" && p.stock > 0) {
        return false;
      }
      if (stockFilter === "low-stock" && (p.stock === 0 || p.stock >= 10)) {
        return false;
      }
      if (search.trim()) {
        const q = search.toLowerCase();
        const matchesName = p.name.toLowerCase().includes(q);
        const matchesSlug = p.slug.toLowerCase().includes(q);
        const matchesTags = p.tags.some((t) => t.toLowerCase().includes(q));
        if (!matchesName && !matchesSlug && !matchesTags) return false;
      }
      return true;
    });
  }, [products, categoryFilter, stockFilter, search]);

  // Catalog statistics
  const stats = useMemo(() => {
    const total = products.length;
    const inStock = products.filter((p) => p.stock > 0).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    const featured = products.filter((p) => p.featured).length;
    return { total, inStock, outOfStock, featured };
  }, [products]);

  function handleOpenCreate() {
    setEditingProduct(null);
    setModalOpen(true);
  }

  function handleOpenEdit(product: Product) {
    setEditingProduct(product);
    setModalOpen(true);
  }

  function handleSaved(product: Product) {
    setProducts((prev) => {
      const idx = prev.findIndex((p) => p.slug === product.slug);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx] = product;
        return copy;
      }
      return [product, ...prev];
    });
  }

  async function handleDelete() {
    if (!deletingProduct) return;
    setDeleting(true);

    try {
      await apiFetch(`/api/products/${deletingProduct.slug}`, {
        method: "DELETE",
      });
      setProducts((prev) => prev.filter((p) => p.slug !== deletingProduct.slug));
      toast.success(`Product "${deletingProduct.name}" removed from catalog.`);
      setDeletingProduct(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setDeleting(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Top Banner & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink tracking-tight sm:text-4xl">
            Product <span className="text-gradient">Management</span>
          </h1>
          <p className="mt-1 text-sm text-ink-500">
            Create, update pricing and inventory, or remove products from the Lumora store.
          </p>
        </div>
        <Button onClick={handleOpenCreate} size="lg" className="gap-2 shadow-glow">
          <Plus className="h-4 w-4" /> Add New Product
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500">Total Products</p>
          <p className="mt-2 text-2xl font-black text-ink">{stats.total}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500">In Stock</p>
          <p className="mt-2 text-2xl font-black text-emerald-600">{stats.inStock}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500">Out of Stock</p>
          <p className="mt-2 text-2xl font-black text-rose-600">{stats.outOfStock}</p>
        </div>
        <div className="card p-5">
          <p className="text-xs font-semibold text-ink-500">Featured</p>
          <p className="mt-2 text-2xl font-black text-amber-500">{stats.featured}</p>
        </div>
      </div>

      {/* Search and Filters Bar */}
      <div className="card p-4 sm:p-5">
        <div className="grid gap-3 sm:grid-cols-[1fr_200px_180px]">
          {/* Search Input */}
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products by name, slug or tag..."
              className="h-11 w-full rounded-xl border border-ink-200 bg-white pl-10 pr-4 text-sm text-ink placeholder:text-ink-400 focus:border-brand-violet focus:outline-none focus:ring-4 focus:ring-brand-violet/15 transition"
            />
          </div>

          {/* Category Filter */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink focus:border-brand-violet focus:outline-none focus:ring-4 focus:ring-brand-violet/15"
          >
            <option value="all">All Categories</option>
            {categories.map((c) => (
              <option key={c.slug} value={c.slug}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="h-11 rounded-xl border border-ink-200 bg-white px-3 text-sm text-ink focus:border-brand-violet focus:outline-none focus:ring-4 focus:ring-brand-violet/15"
          >
            <option value="all">All Inventory</option>
            <option value="in-stock">In Stock</option>
            <option value="low-stock">Low Stock (&lt; 10)</option>
            <option value="out-of-stock">Out of Stock</option>
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="card overflow-hidden">
        <div className="border-b border-ink-100 bg-ink-50/70 p-4 font-bold text-xs uppercase tracking-wider text-ink-600 flex justify-between items-center">
          <span>Showing {filtered.length} of {products.length} Products</span>
          {filtered.length !== products.length && (
            <button
              onClick={() => {
                setSearch("");
                setCategoryFilter("all");
                setStockFilter("all");
              }}
              className="text-brand-violet hover:underline lowercase font-semibold"
            >
              clear filters
            </button>
          )}
        </div>

        {filtered.length === 0 ? (
          <div className="p-12 text-center">
            <p className="text-base font-bold text-ink">No products match your filter criteria.</p>
            <p className="mt-1 text-xs text-ink-400">Try adjusting your search query or filters.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-ink-100 text-xs font-semibold text-ink-500 bg-ink-50/30">
                <tr>
                  <th className="px-5 py-3.5">Product</th>
                  <th className="px-4 py-3.5">Category</th>
                  <th className="px-4 py-3.5">Price</th>
                  <th className="px-4 py-3.5">Stock</th>
                  <th className="px-4 py-3.5">Status</th>
                  <th className="px-5 py-3.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-ink-100">
                {filtered.map((product) => {
                  const cat = categories.find((c) => c.slug === product.categorySlug);
                  const isOut = product.stock === 0;
                  const isLow = product.stock > 0 && product.stock < 10;

                  return (
                    <tr key={product.slug} className="hover:bg-[#FEF9EC]/60 transition">
                      {/* Product Name & Art */}
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3">
                          <div className="h-11 w-11 shrink-0 overflow-hidden rounded-xl border border-ink-100 shadow-sm">
                            <ProductArt art={product.art} name={product.name} />
                          </div>
                          <div className="min-w-0 max-w-xs">
                            <div className="flex items-center gap-1.5">
                              <p className="truncate font-bold text-ink">{product.name}</p>
                              {product.featured && (
                                <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-400 shrink-0" />
                              )}
                            </div>
                            <p className="truncate text-xs text-ink-400 font-mono">{product.slug}</p>
                          </div>
                        </div>
                      </td>

                      {/* Category */}
                      <td className="px-4 py-4">
                        <span className="inline-block rounded-lg bg-ink-100 px-2.5 py-1 text-xs font-semibold text-ink-700">
                          {cat?.name ?? product.categorySlug}
                        </span>
                      </td>

                      {/* Price */}
                      <td className="px-4 py-4">
                        <p className="font-bold text-ink">{formatPrice(product.price)}</p>
                        {product.compareAtPrice && product.compareAtPrice > product.price && (
                          <p className="text-xs text-ink-400 line-through">
                            {formatPrice(product.compareAtPrice)}
                          </p>
                        )}
                      </td>

                      {/* Stock */}
                      <td className="px-4 py-4">
                        <Badge
                          tone={isOut ? "danger" : isLow ? "warning" : "success"}
                          className="font-mono text-xs"
                        >
                          {isOut ? "Out of Stock" : `${product.stock} in stock`}
                        </Badge>
                      </td>

                      {/* Status */}
                      <td className="px-4 py-4">
                        {product.featured ? (
                          <span className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700">
                            <Sparkles className="h-3.5 w-3.5" /> Featured
                          </span>
                        ) : (
                          <span className="text-xs text-ink-400">Standard</span>
                        )}
                      </td>

                      {/* Actions */}
                      <td className="px-5 py-4 text-right">
                        <div className="inline-flex items-center gap-1.5">
                          <Link
                            href={`/products/${product.slug}`}
                            target="_blank"
                            className="grid h-8 w-8 place-items-center rounded-lg text-ink-400 hover:bg-ink-100 hover:text-brand-violet transition"
                            title="View in storefront"
                          >
                            <ExternalLink className="h-4 w-4" />
                          </Link>
                          <button
                            onClick={() => handleOpenEdit(product)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-ink-600 hover:bg-[#FEF9EC] hover:text-[#855000] transition"
                            title="Edit product"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            onClick={() => setDeletingProduct(product)}
                            className="grid h-8 w-8 place-items-center rounded-lg text-rose-500 hover:bg-rose-50 hover:text-rose-700 transition"
                            title="Delete product"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Product Form Modal (Create or Edit) */}
      <ProductFormModal
        isOpen={modalOpen}
        product={editingProduct}
        categories={categories}
        onClose={() => setModalOpen(false)}
        onSuccess={handleSaved}
      />

      {/* Delete Confirmation Modal */}
      {deletingProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/60 backdrop-blur-sm">
          <div className="card w-full max-w-md p-6 bg-white shadow-2xl">
            <div className="flex items-center gap-3 text-rose-600">
              <div className="grid h-10 w-10 place-items-center rounded-full bg-rose-100">
                <AlertTriangle className="h-5 w-5" />
              </div>
              <h3 className="text-lg font-bold">Delete Product?</h3>
            </div>

            <p className="mt-3 text-sm text-ink-600">
              Are you sure you want to delete <strong className="text-ink">{deletingProduct.name}</strong>?
              This action cannot be undone and will remove it from the catalog immediately.
            </p>

            <div className="mt-6 flex items-center justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setDeletingProduct(null)}
                disabled={deleting}
              >
                Cancel
              </Button>
              <Button
                variant="danger"
                loading={deleting}
                onClick={handleDelete}
              >
                Yes, Delete Product
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

