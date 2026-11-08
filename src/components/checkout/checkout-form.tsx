"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  CreditCard,
  DollarSign,
  Lock,
  Package,
  ShieldCheck,
} from "lucide-react";
import { toast } from "sonner";
import { ProductArt } from "@/components/art/product-art";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";
import type { Cart, PaymentMethod } from "@/types";

interface FormFields {
  name: string;
  email: string;
  phone: string;
  addressLine1: string;
  addressLine2: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  paymentMethod: PaymentMethod;
}

export function CheckoutForm({ cart, cardPaymentsEnabled }: { cart: Cart; cardPaymentsEnabled: boolean }) {
  const router = useRouter();
  const { user, setCartCount } = useStore();

  const [form, setForm] = useState<FormFields>({
    name: user?.name ?? "",
    email: user?.email ?? "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    postalCode: "",
    country: "",
    paymentMethod: cardPaymentsEnabled ? "stripe" : "cod",
  });

  const [errors, setErrors] = useState<Partial<Record<keyof FormFields, string>>>({});
  const [loading, setLoading] = useState(false);

  function updateField<K extends keyof FormFields>(field: K, value: FormFields[K]) {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  }

  function validate(): boolean {
    const newErrors: Partial<Record<keyof FormFields, string>> = {};

    if (!form.name.trim() || form.name.trim().length < 2) {
      newErrors.name = "Please enter your full name.";
    }
    if (!form.email.trim() || !form.email.includes("@")) {
      newErrors.email = "Please enter a valid email address.";
    }
    if (!form.phone.trim() || form.phone.trim().length < 5) {
      newErrors.phone = "Please enter a contact phone number.";
    }
    if (!form.addressLine1.trim() || form.addressLine1.trim().length < 3) {
      newErrors.addressLine1 = "Please enter your street address.";
    }
    if (!form.city.trim()) {
      newErrors.city = "City is required.";
    }
    if (!form.state.trim()) {
      newErrors.state = "State or province is required.";
    }
    if (!form.postalCode.trim()) {
      newErrors.postalCode = "Postal / ZIP code is required.";
    }
    if (form.country.trim().length < 2) {
      newErrors.country = "Country is required.";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!validate()) {
      toast.error("Please fill in all required shipping and contact details.");
      return;
    }

    setLoading(true);

    try {
      const res = await apiFetch<{
        order: { id: string };
        redirectUrl: string;
      }>("/api/checkout", {
        method: "POST",
        json: {
          paymentMethod: form.paymentMethod,
          customer: {
            name: form.name.trim(),
            email: form.email.trim(),
            phone: form.phone.trim(),
          },
          shippingAddress: {
            addressLine1: form.addressLine1.trim(),
            addressLine2: form.addressLine2.trim() || undefined,
            city: form.city.trim(),
            state: form.state.trim(),
            postalCode: form.postalCode.trim(),
            country: form.country.trim(),
          },
        },
      });

      if (form.paymentMethod === "cod") {
        setCartCount(0);
        toast.success("Order placed successfully via Cash on Delivery!");
        router.push(res.redirectUrl);
      } else {
        // Stripe checkout: redirect to Stripe-hosted checkout page
        toast.loading("Redirecting to secure Stripe checkout...");
        window.location.href = res.redirectUrl;
      }
    } catch (err) {
      toast.error(errorMessage(err));
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div className="grid gap-8 lg:grid-cols-[1fr_420px] lg:items-start">
        {/* Left Column: Contact, Shipping, Payment */}
        <div className="space-y-8">
          {/* Contact Details */}
          <section className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FDC841]/25 text-[#855000] font-black text-sm">
                1
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">Contact Information</h2>
                <p className="text-xs text-ink-500">Where we will send your order confirmation</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Input
                label="Full name"
                value={form.name}
                onChange={(e) => updateField("name", e.target.value)}
                error={errors.name}
                placeholder="Jane Doe"
                required
              />
              <Input
                label="Email address"
                type="email"
                value={form.email}
                onChange={(e) => updateField("email", e.target.value)}
                error={errors.email}
                placeholder="jane@example.com"
                required
              />
              <div className="sm:col-span-2">
                <Input
                  label="Phone number"
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  error={errors.phone}
                  placeholder="+1 (555) 000-0000"
                  hint="Required for delivery updates and courier dispatch."
                  required
                />
              </div>
            </div>
          </section>

          {/* Shipping Address */}
          <section className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FDC841]/25 text-[#855000] font-black text-sm">
                2
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">Shipping Address</h2>
                <p className="text-xs text-ink-500">Physical address for doorstep delivery</p>
              </div>
            </div>

            <div className="mt-6 space-y-4">
              <Input
                label="Street address"
                value={form.addressLine1}
                onChange={(e) => updateField("addressLine1", e.target.value)}
                error={errors.addressLine1}
                placeholder="123 Market Street"
                required
              />
              <Input
                label="Apartment, suite, unit (optional)"
                value={form.addressLine2}
                onChange={(e) => updateField("addressLine2", e.target.value)}
                placeholder="Apt 4B"
              />
              <div className="grid gap-4 sm:grid-cols-3">
                <Input
                  label="City"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  error={errors.city}
                  placeholder="San Francisco"
                  required
                />
                <Input
                  label="State / Province"
                  value={form.state}
                  onChange={(e) => updateField("state", e.target.value)}
                  error={errors.state}
                  placeholder="CA"
                  required
                />
                <Input
                  label="ZIP / Postal code"
                  value={form.postalCode}
                  onChange={(e) => updateField("postalCode", e.target.value)}
                  error={errors.postalCode}
                  placeholder="94103"
                  required
                />
              </div>
              <Input
                label="Country"
                value={form.country}
                onChange={(e) => updateField("country", e.target.value)}
                error={errors.country}
                placeholder="Bangladesh"
                autoComplete="country-name"
                required
              />
            </div>
          </section>

          {/* Payment Method */}
          <section className="card p-6 sm:p-8">
            <div className="flex items-center gap-3 border-b border-ink-100 pb-4">
              <div className="grid h-8 w-8 place-items-center rounded-full bg-[#FDC841]/25 text-[#855000] font-black text-sm">
                3
              </div>
              <div>
                <h2 className="text-lg font-bold text-ink">Payment Method</h2>
                <p className="text-xs text-ink-500">Select how you want to pay</p>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {/* Stripe Card Option */}
              <button
                type="button"
                onClick={() => updateField("paymentMethod", "stripe")}
                disabled={!cardPaymentsEnabled}
                aria-pressed={form.paymentMethod === "stripe"}
                className={cn(
                  "cursor-pointer rounded-2xl border-2 p-5 text-left transition-all disabled:cursor-not-allowed disabled:opacity-60",
                  form.paymentMethod === "stripe"
                    ? "border-[#FDC841] bg-[#FEF9EC] shadow-sm ring-2 ring-[#FDC841]/30"
                    : "border-ink-200 bg-white hover:border-ink-300",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-[#1E1E1E] text-[#FDC841]">
                      <CreditCard className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">Pay with Card</p>
                      <p className="text-xs text-ink-500">Stripe Checkout</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border-2",
                      form.paymentMethod === "stripe"
                        ? "border-[#FDC841] bg-[#FDC841] text-[#181715]"
                        : "border-ink-300",
                    )}
                  >
                    {form.paymentMethod === "stripe" && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </div>
                <p className="mt-3 text-xs text-ink-600 leading-relaxed">
                  {cardPaymentsEnabled
                    ? "Fast, encrypted checkout supporting Visa, Mastercard, Amex, Apple Pay & Google Pay."
                    : "Card payments aren't enabled on this store yet. Choose cash on delivery."}
                </p>
              </button>

              {/* Cash On Delivery Option */}
              <button
                type="button"
                onClick={() => updateField("paymentMethod", "cod")}
                aria-pressed={form.paymentMethod === "cod"}
                className={cn(
                  "cursor-pointer rounded-2xl border-2 p-5 text-left transition-all",
                  form.paymentMethod === "cod"
                    ? "border-emerald-600 bg-emerald-50/60 shadow-sm ring-2 ring-emerald-600/20"
                    : "border-ink-200 bg-white hover:border-ink-300",
                )}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2.5">
                    <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-600 text-white">
                      <DollarSign className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-bold text-ink">Cash on Delivery</p>
                      <p className="text-xs text-ink-500">Pay at doorstep</p>
                    </div>
                  </div>
                  <div
                    className={cn(
                      "grid h-5 w-5 place-items-center rounded-full border-2",
                      form.paymentMethod === "cod"
                        ? "border-emerald-600 bg-emerald-600 text-white"
                        : "border-ink-300",
                    )}
                  >
                    {form.paymentMethod === "cod" && <CheckCircle2 className="h-4 w-4" />}
                  </div>
                </div>
                <p className="mt-3 text-xs text-ink-600 leading-relaxed">
                  Pay with physical cash or card directly to the courier when your parcel arrives.
                </p>
              </button>
            </div>

            <div className="mt-6 flex items-center gap-2 rounded-xl bg-ink-50 p-3 text-xs text-ink-500">
              <ShieldCheck className="h-4 w-4 shrink-0 text-emerald-600" />
              <span>All transactions are end-to-end secured with industry-standard 256-bit encryption.</span>
            </div>
          </section>
        </div>

        {/* Right Column: Order Summary & Action */}
        <aside className="sticky top-24 space-y-6">
          <div className="card overflow-hidden">
            <div className="border-b border-ink-100 bg-ink-50/70 p-5">
              <h3 className="font-extrabold text-ink">Order Summary ({cart.itemCount} items)</h3>
            </div>

            {/* Line Items List */}
            <div className="max-h-72 divide-y divide-ink-100 overflow-y-auto p-5">
              {cart.lines.map((line) => (
                <div key={line.product.slug} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                  <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl border border-ink-100">
                    <ProductArt art={line.product.art} name={line.product.name} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-ink">{line.product.name}</p>
                    <p className="text-xs text-ink-500">
                      Qty: {line.quantity} × {formatPrice(line.product.price)}
                    </p>
                  </div>
                  <p className="text-sm font-bold text-ink">{formatPrice(line.lineTotal)}</p>
                </div>
              ))}
            </div>

            {/* Pricing Breakdown */}
            <div className="border-t border-ink-100 p-5">
              <dl className="space-y-2.5 text-sm">
                <div className="flex justify-between">
                  <dt className="text-ink-500">Subtotal</dt>
                  <dd className="font-semibold text-ink">{formatPrice(cart.subtotal)}</dd>
                </div>
                {cart.savings > 0 && (
                  <div className="flex justify-between text-fuchsia-700">
                    <dt>Sale savings (included)</dt>
                    <dd className="font-semibold">{formatPrice(cart.savings)}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-ink-500">Shipping</dt>
                  <dd className="font-semibold text-ink">
                    {cart.shipping === 0 ? (
                      <span className="text-emerald-600 font-bold">Free</span>
                    ) : (
                      formatPrice(cart.shipping)
                    )}
                  </dd>
                </div>
                <div className="flex items-baseline justify-between border-t border-ink-100 pt-3 text-base">
                  <dt className="font-extrabold text-ink">Total Due</dt>
                  <dd className="text-2xl font-black text-ink">{formatPrice(cart.total)}</dd>
                </div>
              </dl>

              <Button
                type="submit"
                size="lg"
                loading={loading}
                className="mt-6 w-full gap-2 text-base shadow-glow"
              >
                {form.paymentMethod === "stripe" ? (
                  <>
                    <CreditCard className="h-4 w-4" /> Pay with Stripe
                  </>
                ) : (
                  <>
                    <Package className="h-4 w-4" /> Place COD Order
                  </>
                )}
              </Button>

              <Link
                href="/cart"
                className="mt-3 flex items-center justify-center gap-1.5 text-center text-xs font-semibold text-ink-500 hover:text-brand-violet transition"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Return to Cart
              </Link>
            </div>
          </div>

          <div className="flex items-center justify-center gap-2 text-xs text-ink-400">
            <Lock className="h-3.5 w-3.5" />
            <span>Guaranteed safe checkout & hassle-free 30-day returns</span>
          </div>
        </aside>
      </div>
    </form>
  );
}

