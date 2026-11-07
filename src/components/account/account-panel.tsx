"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, LogOut, ShieldCheck, ShoppingBag, Trash2, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { useStore } from "@/components/providers/store-provider";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClasses } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client/api";
import { nameSchema } from "@/lib/validation/schemas";
import type { PublicUser } from "@/types";

export function AccountPanel({ user: initial, cartCount, wishlistCount }: { user: PublicUser; cartCount: number; wishlistCount: number }) {
  const router = useRouter();
  const { setUser, setCartCount, setWishlist } = useStore();
  const [user, setLocalUser] = useState(initial);
  const [name, setName] = useState(initial.name);
  const [nameError, setNameError] = useState<string>();
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [deleting, setDeleting] = useState(false);

  async function saveName(e: React.FormEvent) {
    e.preventDefault();
    const parsed = nameSchema.safeParse(name);
    if (!parsed.success) return setNameError(parsed.error.issues[0]?.message);
    setNameError(undefined);
    setSaving(true);
    try {
      const res = await apiFetch<{ user: PublicUser }>("/api/account", { method: "PATCH", json: { name: parsed.data } });
      setLocalUser(res.user);
      setUser(res.user);
      toast.success("Profile updated");
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && error.fieldErrors.name) setNameError(error.fieldErrors.name);
      else toast.error(errorMessage(error));
    } finally {
      setSaving(false);
    }
  }

  async function signOut() {
    setSigningOut(true);
    try {
      await apiFetch("/api/auth/signout", { method: "POST" });
      setUser(null);
      setCartCount(0);
      setWishlist([]);
      toast.success("Signed out. See you soon!");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      setSigningOut(false);
    }
  }

  async function deleteAccount() {
    setDeleting(true);
    try {
      await apiFetch("/api/account", { method: "DELETE" });
      setUser(null);
      setCartCount(0);
      setWishlist([]);
      toast.success("Your account has been deleted.");
      router.replace("/");
      router.refresh();
    } catch (error) {
      toast.error(errorMessage(error));
      setDeleting(false);
    }
  }

  const initials = user.name
    .split(/\s+/)
    .map((p) => p[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className="grid gap-6 lg:grid-cols-[320px_1fr]">
      <aside className="card relative overflow-hidden p-6 text-center">
        <div className="absolute inset-x-0 top-0 h-24 bg-brand-gradient" aria-hidden />
        <div className="relative mx-auto mt-8 grid h-24 w-24 place-items-center rounded-full border-4 border-white dark:border-[#2C2924] bg-ink text-3xl font-black text-white shadow-card">
          {initials}
        </div>
        <p className="mt-4 text-xl font-extrabold">{user.name}</p>
        <p className="text-sm text-ink-500">{user.email}</p>
        {user.role === "admin" && (
          <Badge tone="dark" className="mt-3">
            <ShieldCheck className="mr-1 h-3.5 w-3.5" /> Admin
          </Badge>
        )}
        <p className="mt-4 text-xs text-ink-400">
          Member since {new Date(user.createdAt).toLocaleDateString("en-US", { month: "long", year: "numeric" })}
        </p>
        <div className="mt-6 grid grid-cols-2 gap-3">
          <Link href="/cart" className="rounded-2xl bg-ink-50 p-4 transition hover:bg-[#FEF9EC] dark:hover:bg-[#2A261D]">
            <ShoppingBag className="mx-auto h-5 w-5 text-ink-700" />
            <p className="mt-1 text-2xl font-black">{cartCount}</p>
            <p className="text-xs text-ink-500">In cart</p>
          </Link>
          <Link href="/wishlist" className="rounded-2xl bg-ink-50 p-4 transition hover:bg-[#FEF9EC] dark:hover:bg-[#2A261D]">
            <Heart className="mx-auto h-5 w-5 text-[#D97706]" />
            <p className="mt-1 text-2xl font-black">{wishlistCount}</p>
            <p className="text-xs text-ink-500">Saved</p>
          </Link>
        </div>
        <Button variant="outline" className="mt-6 w-full" onClick={signOut} loading={signingOut}>
          {!signingOut && <LogOut className="h-4 w-4" />} Sign out
        </Button>
      </aside>

      <div className="space-y-6">
        {user.role === "admin" && (
          <section className="card p-6 border-[#FDC841]/40 bg-[#FEF9EC] dark:bg-[#252219] dark:border-[#FDC841]/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-[#1E1E1E] text-white shadow-sm">
                <ShieldCheck className="h-6 w-6 text-[#FDC841]" />
              </div>
              <div>
                <h3 className="font-extrabold text-ink">Administrator Dashboard</h3>
                <p className="text-xs text-ink-500">Create, update pricing & inventory, or remove store products.</p>
              </div>
            </div>
            <Link href="/admin/products" className={buttonClasses("primary", "md", "shadow-glow")}>
              Manage Products
            </Link>
          </section>
        )}

        <section className="card p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold">
            <UserIcon className="h-5 w-5 text-brand-violet" /> Profile
          </h2>
          <form onSubmit={saveName} noValidate className="mt-6 grid gap-4 sm:grid-cols-2">
            <Input label="Full name" value={name} onChange={(e) => setName(e.target.value)} error={nameError} autoComplete="name" />
            <Input label="Email" value={user.email} disabled hint="Email can't be changed." className="bg-ink-50 text-ink-500" />
            <div className="sm:col-span-2">
              <Button type="submit" loading={saving} disabled={name.trim() === user.name}>
                Save changes
              </Button>
            </div>
          </form>
        </section>

        <section className="card border-rose-200 p-6 sm:p-8">
          <h2 className="flex items-center gap-2 text-xl font-extrabold text-rose-700">
            <Trash2 className="h-5 w-5" /> Delete account
          </h2>
          <p className="mt-2 text-sm text-ink-500">This permanently removes your profile, cart and wishlist. It can&apos;t be undone.</p>
          {!confirmDelete ? (
            <Button variant="outline" className="mt-5 border-rose-200 text-rose-600 hover:border-rose-500 hover:text-rose-700" onClick={() => setConfirmDelete(true)}>
              Delete my account
            </Button>
          ) : (
            <div className="mt-5 space-y-3 rounded-2xl bg-rose-50 p-4">
              <Input
                label='Type "DELETE" to confirm'
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                autoComplete="off"
              />
              <div className="flex flex-wrap gap-2">
                <Button variant="danger" disabled={confirmText !== "DELETE"} loading={deleting} onClick={deleteAccount}>
                  Permanently delete
                </Button>
                <Button variant="ghost" onClick={() => (setConfirmDelete(false), setConfirmText(""))}>
                  Cancel
                </Button>
              </div>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
