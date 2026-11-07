"use client";

import { useState } from "react";
import { Plus, Trash2, X } from "lucide-react";
import { toast } from "sonner";
import { ProductArt } from "@/components/art/product-art";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { slugify } from "@/lib/utils/slug";
import type { ArtIcon, Category, Product } from "@/types";

const AVAILABLE_ICONS: ArtIcon[] = [
  "headphones",
  "speaker",
  "watch",
  "smartphone",
  "lamp",
  "lightbulb",
  "camera",
  "keyboard",
  "mouse",
  "monitor",
  "laptop",
  "backpack",
  "luggage",
  "briefcase",
  "glasses",
  "wallet",
  "dumbbell",
  "bottle",
  "coffee",
  "gamepad",
  "sparkles",
];

interface ProductFormModalProps {
  product?: Product | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (savedProduct: Product) => void;
}

export function ProductFormModal({
  product,
  categories,
  isOpen,
  onClose,
  onSuccess,
}: ProductFormModalProps) {
  const isEditing = Boolean(product);

  const [name, setName] = useState(product?.name ?? "");
  const [slug, setSlug] = useState(product?.slug ?? "");
  const [tagline, setTagline] = useState(product?.tagline ?? "");
  const [description, setDescription] = useState(product?.description ?? "");
  const [categorySlug, setCategorySlug] = useState(
    product?.categorySlug ?? categories[0]?.slug ?? "audio",
  );
  const [priceDollars, setPriceDollars] = useState(
    product ? (product.price / 100).toFixed(2) : "99.00",
  );
  const [compareAtDollars, setCompareAtDollars] = useState(
    product?.compareAtPrice ? (product.compareAtPrice / 100).toFixed(2) : "",
  );
  const [stock, setStock] = useState(product ? String(product.stock) : "25");
  const [featured, setFeatured] = useState(product?.featured ?? false);

  // Visual Art
  const [artIcon, setArtIcon] = useState<ArtIcon>(product?.art.icon ?? "headphones");
  const [artFrom, setArtFrom] = useState(product?.art.from ?? "#FDC841");
  const [artTo, setArtTo] = useState(product?.art.to ?? "#D97706");

  // Tags & Features & Specs
  const [tagsStr, setTagsStr] = useState(product?.tags.join(", ") ?? "premium, wireless");
  const [features, setFeatures] = useState<string[]>(
    product?.features ?? ["Crafted with aerospace-grade materials", "Ultra-long battery life"],
  );
  const [specs, setSpecs] = useState<{ label: string; value: string }[]>(
    product?.specs ?? [{ label: "Warranty", value: "2 Years" }],
  );

  const [loading, setLoading] = useState(false);

  if (!isOpen) return null;

  function handleNameChange(val: string) {
    setName(val);
    if (!isEditing) {
      setSlug(slugify(val));
    }
  }

  function addFeature() {
    setFeatures((prev) => [...prev, ""]);
  }

  function updateFeature(index: number, val: string) {
    setFeatures((prev) => {
      const copy = [...prev];
      copy[index] = val;
      return copy;
    });
  }

  function removeFeature(index: number) {
    setFeatures((prev) => prev.filter((_, i) => i !== index));
  }

  function addSpec() {
    setSpecs((prev) => [...prev, { label: "", value: "" }]);
  }

  function updateSpec(index: number, key: "label" | "value", val: string) {
    setSpecs((prev) => {
      const copy = [...prev];
      copy[index] = { ...copy[index]!, [key]: val };
      return copy;
    });
  }

  function removeSpec(index: number) {
    setSpecs((prev) => prev.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    const priceCents = Math.round(parseFloat(priceDollars) * 100);
    if (isNaN(priceCents) || priceCents <= 0) {
      toast.error("Please enter a valid positive price.");
      return;
    }

    let compareCents: number | undefined = undefined;
    if (compareAtDollars.trim()) {
      compareCents = Math.round(parseFloat(compareAtDollars) * 100);
      if (isNaN(compareCents) || compareCents <= priceCents) {
        toast.error("Compare-at price must be greater than current price.");
        return;
      }
    }

    const stockNum = parseInt(stock, 10);
    if (isNaN(stockNum) || stockNum < 0) {
      toast.error("Stock must be zero or a positive whole number.");
      return;
    }

    if (!slug.trim()) {
      toast.error("Product slug is required.");
      return;
    }

    const cleanFeatures = features.map((f) => f.trim()).filter(Boolean);
    const cleanSpecs = specs
      .map((s) => ({ label: s.label.trim(), value: s.value.trim() }))
      .filter((s) => s.label && s.value);
    const cleanTags = tagsStr
      .split(",")
      .map((t) => t.trim())
      .filter(Boolean);

    setLoading(true);

    try {
      if (isEditing) {
        // PATCH /api/products/[slug]
        const res = await apiFetch<{ product: Product }>(`/api/products/${product!.slug}`, {
          method: "PATCH",
          json: {
            name: name.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            price: priceCents,
            compareAtPrice: compareCents ?? null,
            stock: stockNum,
            featured,
            tags: cleanTags,
          },
        });
        toast.success(`Updated "${res.product.name}" successfully.`);
        onSuccess(res.product);
      } else {
        // POST /api/products
        const res = await apiFetch<{ product: Product }>("/api/products", {
          method: "POST",
          json: {
            slug: slug.trim(),
            name: name.trim(),
            tagline: tagline.trim(),
            description: description.trim(),
            categorySlug,
            price: priceCents,
            compareAtPrice: compareCents,
            stock: stockNum,
            featured,
            tags: cleanTags,
            features: cleanFeatures.length > 0 ? cleanFeatures : ["High-performance product"],
            specs: cleanSpecs.length > 0 ? cleanSpecs : [{ label: "Standard", value: "Verified" }],
            colors: [{ name: "Standard", hex: artFrom }],
            art: {
              icon: artIcon,
              from: artFrom,
              to: artTo,
            },
            images: [],
          },
        });
        toast.success(`Created "${res.product.name}" successfully.`);
        onSuccess(res.product);
      }
      onClose();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-ink/60 backdrop-blur-sm overflow-y-auto">
      <div className="card relative w-full max-w-3xl max-h-[90vh] overflow-y-auto p-6 sm:p-8 bg-white shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-ink-100 pb-4">
          <div>
            <h2 className="text-xl font-black text-ink">
              {isEditing ? `Edit Product: ${product?.name}` : "Create New Product"}
            </h2>
            <p className="text-xs text-ink-500">
              {isEditing
                ? "Update pricing, stock levels, and descriptive metadata."
                : "Fill out the fields to publish a new product to your catalog."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-full text-ink-400 hover:bg-ink-100 hover:text-ink transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="mt-6 space-y-6">
          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              1. Basic Information
            </h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input
                label="Product Name"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="e.g. Apex Ultra Wireless Earbuds"
                required
              />
              <Input
                label="URL Slug"
                value={slug}
                disabled={isEditing}
                onChange={(e) => setSlug(e.target.value)}
                hint={isEditing ? "Slug cannot be changed once created." : "Unique URL identifier"}
                placeholder="e.g. apex-ultra-wireless-earbuds"
                required
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="block text-sm font-semibold text-ink mb-1.5">Category</label>
                <select
                  disabled={isEditing}
                  value={categorySlug}
                  onChange={(e) => setCategorySlug(e.target.value)}
                  className="h-12 w-full rounded-2xl border border-ink-200 bg-white px-4 text-sm text-ink focus:border-brand-violet focus:outline-none focus:ring-4 focus:ring-brand-violet/15"
                >
                  {categories.map((c) => (
                    <option key={c.slug} value={c.slug}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <Input
                label="Tagline"
                value={tagline}
                onChange={(e) => setTagline(e.target.value)}
                placeholder="e.g. Studio audio anywhere you roam"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-semibold text-ink mb-1.5">Description</label>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full rounded-2xl border border-ink-200 bg-white p-4 text-sm text-ink placeholder:text-ink-300 focus:border-brand-violet focus:outline-none focus:ring-4 focus:ring-brand-violet/15"
                placeholder="Detailed description of features, soundstage, craftsmanship..."
                required
              />
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="space-y-4 pt-4 border-t border-ink-100">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              2. Pricing & Inventory
            </h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <Input
                label="Price ($ USD)"
                type="number"
                step="0.01"
                min="0.50"
                value={priceDollars}
                onChange={(e) => setPriceDollars(e.target.value)}
                placeholder="199.00"
                required
              />
              <Input
                label="Compare At Price (Optional)"
                type="number"
                step="0.01"
                value={compareAtDollars}
                onChange={(e) => setCompareAtDollars(e.target.value)}
                placeholder="249.00"
                hint="Original price if product is on sale"
              />
              <Input
                label="Stock Quantity"
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                required
              />
            </div>

            <div className="flex items-center gap-3">
              <input
                id="featured-check"
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="h-4 w-4 rounded border-ink-300 text-brand-violet focus:ring-brand-violet"
              />
              <label htmlFor="featured-check" className="text-sm font-semibold text-ink cursor-pointer">
                Highlight this product as &quot;Featured&quot; on the home page
              </label>
            </div>
          </div>

          {/* Section 3: Visual Artwork & Icon (Create mode only or display) */}
          {!isEditing && (
            <div className="space-y-4 pt-4 border-t border-ink-100">
              <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
                3. Generated Artwork & Colors
              </h3>
              <div className="grid gap-6 sm:grid-cols-[140px_1fr] items-center">
                {/* Live Preview */}
                <div className="space-y-1.5 text-center">
                  <div className="mx-auto h-28 w-28 overflow-hidden rounded-2xl border border-ink-200 shadow-sm">
                    <ProductArt art={{ icon: artIcon, from: artFrom, to: artTo }} name={name || "Product"} />
                  </div>
                  <span className="text-[11px] font-semibold text-ink-400">Live Artwork</span>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="block text-xs font-semibold text-ink mb-1">Select Icon</label>
                    <div className="flex flex-wrap gap-1.5 max-h-24 overflow-y-auto p-1.5 rounded-xl border border-ink-100 bg-ink-50/50">
                      {AVAILABLE_ICONS.map((ic) => (
                        <button
                          key={ic}
                          type="button"
                          onClick={() => setArtIcon(ic)}
                          className={`rounded-lg px-2 py-1 text-xs font-semibold transition ${
                            artIcon === ic
                              ? "bg-[#1E1E1E] text-white shadow-sm"
                              : "bg-white text-ink-600 hover:bg-ink-100"
                          }`}
                        >
                          {ic}
                        </button>
                      ))}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Gradient Start</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={artFrom}
                          onChange={(e) => setArtFrom(e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded-lg border-0 p-0"
                        />
                        <input
                          type="text"
                          value={artFrom}
                          onChange={(e) => setArtFrom(e.target.value)}
                          className="h-9 w-full rounded-xl border border-ink-200 px-3 text-xs font-mono text-ink"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-ink mb-1">Gradient End</label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={artTo}
                          onChange={(e) => setArtTo(e.target.value)}
                          className="h-9 w-9 cursor-pointer rounded-lg border-0 p-0"
                        />
                        <input
                          type="text"
                          value={artTo}
                          onChange={(e) => setArtTo(e.target.value)}
                          className="h-9 w-full rounded-xl border border-ink-200 px-3 text-xs font-mono text-ink"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Section 4: Tags, Features & Specs */}
          <div className="space-y-4 pt-4 border-t border-ink-100">
            <h3 className="text-sm font-bold text-ink uppercase tracking-wider">
              4. Specifications & Tags
            </h3>

            <Input
              label="Tags (comma-separated)"
              value={tagsStr}
              onChange={(e) => setTagsStr(e.target.value)}
              placeholder="e.g. bluetooth, anc, wireless, waterproof"
            />

            {!isEditing && (
              <div className="grid gap-6 sm:grid-cols-2">
                {/* Features */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-ink">Key Highlights</label>
                    <button
                      type="button"
                      onClick={addFeature}
                      className="text-xs font-semibold text-brand-violet hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {features.map((feat, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={feat}
                          onChange={(e) => updateFeature(idx, e.target.value)}
                          placeholder="Feature description"
                          className="h-9 flex-1 rounded-xl border border-ink-200 px-3 text-xs text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => removeFeature(idx)}
                          className="grid h-8 w-8 place-items-center text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Specs */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-bold text-ink">Technical Specs</label>
                    <button
                      type="button"
                      onClick={addSpec}
                      className="text-xs font-semibold text-brand-violet hover:underline inline-flex items-center gap-1"
                    >
                      <Plus className="h-3 w-3" /> Add
                    </button>
                  </div>
                  <div className="space-y-2">
                    {specs.map((sp, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          type="text"
                          value={sp.label}
                          onChange={(e) => updateSpec(idx, "label", e.target.value)}
                          placeholder="Label (e.g. Battery)"
                          className="h-9 w-1/2 rounded-xl border border-ink-200 px-3 text-xs text-ink"
                        />
                        <input
                          type="text"
                          value={sp.value}
                          onChange={(e) => updateSpec(idx, "value", e.target.value)}
                          placeholder="Value (e.g. 40 hrs)"
                          className="h-9 w-1/2 rounded-xl border border-ink-200 px-3 text-xs text-ink"
                        />
                        <button
                          type="button"
                          onClick={() => removeSpec(idx)}
                          className="grid h-8 w-8 place-items-center text-rose-500 hover:bg-rose-50 rounded-lg"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-ink-100">
            <Button type="button" variant="outline" onClick={onClose} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" loading={loading}>
              {isEditing ? "Save Changes" : "Create Product"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

