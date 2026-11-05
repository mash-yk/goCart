"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client/api";
import type { Cart, PublicUser } from "@/types";

interface StoreState {
  user: PublicUser | null;
  cartCount: number;
  wishlist: Set<string>;
}

interface StoreContextValue extends StoreState {
  addToCart: (productSlug: string, quantity?: number, productName?: string) => Promise<boolean>;
  toggleWishlist: (productSlug: string, productName?: string) => Promise<void>;
  isWishlisted: (productSlug: string) => boolean;
  setCartCount: (count: number) => void;
  setWishlist: (slugs: string[]) => void;
  setUser: (user: PublicUser | null) => void;
}

const StoreContext = createContext<StoreContextValue | null>(null);

export function StoreProvider({
  children,
  initialUser,
  initialCartCount,
  initialWishlist,
}: {
  children: ReactNode;
  initialUser: PublicUser | null;
  initialCartCount: number;
  initialWishlist: string[];
}) {
  const router = useRouter();
  const [user, setUser] = useState(initialUser);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [wishlist, setWishlistState] = useState(() => new Set(initialWishlist));

  const setWishlist = useCallback((slugs: string[]) => setWishlistState(new Set(slugs)), []);

  // Keep client state in step with fresh server data after router.refresh() or sign-in.
  const wishlistKey = initialWishlist.join("|");
  useEffect(() => setUser(initialUser), [initialUser]);
  useEffect(() => setCartCount(initialCartCount), [initialCartCount]);
  useEffect(() => setWishlistState(new Set(wishlistKey ? wishlistKey.split("|") : [])), [wishlistKey]);

  const addToCart = useCallback(
    async (productSlug: string, quantity = 1, productName?: string) => {
      try {
        const { cart } = await apiFetch<{ cart: Cart }>("/api/cart", {
          method: "POST",
          json: { productSlug, quantity },
        });
        setCartCount(cart.itemCount);
        toast.success(`${productName ?? "Item"} added to your cart`, {
          action: { label: "View cart", onClick: () => router.push("/cart") },
        });
        router.refresh();
        return true;
      } catch (error) {
        toast.error(errorMessage(error));
        return false;
      }
    },
    [router],
  );

  const toggleWishlist = useCallback(
    async (productSlug: string, productName?: string) => {
      const saved = wishlist.has(productSlug);
      // Optimistic update: flip the heart immediately, roll back if the request fails.
      setWishlistState((prev) => {
        const next = new Set(prev);
        if (saved) next.delete(productSlug);
        else next.add(productSlug);
        return next;
      });
      try {
        const res = saved
          ? await apiFetch<{ productSlugs: string[] }>(`/api/wishlist/${productSlug}`, { method: "DELETE" })
          : await apiFetch<{ productSlugs: string[] }>("/api/wishlist", { method: "POST", json: { productSlug } });
        setWishlist(res.productSlugs);
        toast.success(saved ? `Removed from your wishlist` : `${productName ?? "Item"} saved to your wishlist`);
        router.refresh();
      } catch (error) {
        if (error instanceof ApiClientError && error.code === "ALREADY_IN_WISHLIST") return; // already saved
        setWishlistState((prev) => {
          const next = new Set(prev);
          if (saved) next.add(productSlug);
          else next.delete(productSlug);
          return next;
        });
        toast.error(errorMessage(error));
      }
    },
    [wishlist, router, setWishlist],
  );

  const value = useMemo<StoreContextValue>(
    () => ({
      user,
      cartCount,
      wishlist,
      addToCart,
      toggleWishlist,
      isWishlisted: (slug) => wishlist.has(slug),
      setCartCount,
      setWishlist,
      setUser,
    }),
    [user, cartCount, wishlist, addToCart, toggleWishlist, setWishlist],
  );

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreContextValue {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used inside <StoreProvider>.");
  return ctx;
}
