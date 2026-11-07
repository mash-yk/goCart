"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Heart, Menu, Search, ShoppingBag, User, X } from "lucide-react";
import { useStore } from "@/components/providers/store-provider";
import { ProductArt } from "@/components/art/product-art";
import { Logo } from "./logo";
import { SearchBox } from "./search-box";
import { ThemeToggle } from "./theme-toggle";
import { cn } from "@/lib/utils/cn";
import type { Category } from "@/types";

function CountBadge({ count }: { count: number }) {
  if (count <= 0) return null;
  return (
    <span
      key={count}
      className="absolute -right-1 -top-1 grid h-5 min-w-5 animate-pop place-items-center rounded-full bg-[#FDC841] px-1 text-[10px] font-extrabold text-[#181715] ring-2 ring-white dark:ring-[#1E1E1E] shadow-sm"
    >
      {count > 99 ? "99+" : count}
    </span>
  );
}

export function HeaderClient({ categories }: { categories: Category[] }) {
  const pathname = usePathname();
  const { cartCount, wishlist, user } = useStore();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
    setSearchOpen(false);
  }, [pathname]);

  useEffect(() => {
    document.body.style.overflow = menuOpen ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [menuOpen]);

  const iconBtn =
    "relative grid h-10 w-10 place-items-center rounded-full text-ink transition hover:bg-ink-100 hover:text-ink dark:text-[#EAE6DF] dark:hover:bg-[#252320] dark:hover:text-[#FDC841]";

  return (
    <>
      <header
        className={cn(
          "sticky top-0 z-40 transition-all duration-300",
          scrolled
            ? "glass shadow-[0_4px_24px_-4px_rgba(24,23,21,0.06)] dark:shadow-none"
            : "bg-[#FBF9F4]/80 backdrop-blur-md dark:bg-[#121110]/80",
        )}
      >
        <div className="container flex h-16 items-center gap-3 lg:h-[72px] lg:gap-6">
          <button className={cn(iconBtn, "lg:hidden")} onClick={() => setMenuOpen(true)} aria-label="Open menu">
            <Menu className="h-5 w-5" />
          </button>

          <Logo />

          <nav className="hidden items-center gap-1.5 lg:flex" aria-label="Main">
            <Link
              href="/products"
              className={cn(
                "rounded-full px-4 py-2 text-sm font-semibold transition",
                pathname === "/products"
                  ? "bg-[#1E1E1E] text-white shadow-sm dark:bg-[#FDC841] dark:text-[#181715]"
                  : "text-ink-600 hover:bg-ink-100 hover:text-ink dark:text-[#A39E93] dark:hover:bg-[#252320] dark:hover:text-[#F5F3EF]",
              )}
            >
              Shop all
            </Link>
            {categories.slice(0, 4).map((c) => (
              <Link
                key={c.slug}
                href={`/categories/${c.slug}`}
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  pathname === `/categories/${c.slug}`
                    ? "bg-[#1E1E1E] text-white shadow-sm dark:bg-[#FDC841] dark:text-[#181715]"
                    : "text-ink-600 hover:bg-ink-100 hover:text-ink dark:text-[#A39E93] dark:hover:bg-[#252320] dark:hover:text-[#F5F3EF]",
                )}
              >
                {c.name}
              </Link>
            ))}
            {user?.role === "admin" && (
              <Link
                href="/admin/products"
                className={cn(
                  "rounded-full px-4 py-2 text-sm font-semibold transition",
                  pathname.startsWith("/admin")
                    ? "bg-[#1E1E1E] text-white shadow-sm dark:bg-[#FDC841] dark:text-[#181715]"
                    : "text-[#855000] bg-[#FDC841]/20 hover:bg-[#FDC841]/35 dark:text-[#FDC841] dark:bg-[#FDC841]/15",
                )}
              >
                Admin
              </Link>
            )}
          </nav>

          <div className="ml-auto hidden max-w-sm flex-1 md:block">
            <Suspense fallback={<div className="h-11 rounded-full border border-ink-200 bg-white/80 dark:border-[#2C2924] dark:bg-[#1A1916]" />}>
              <SearchBox />
            </Suspense>
          </div>

          <div className="ml-auto flex items-center gap-1 md:ml-0">
            <button className={cn(iconBtn, "md:hidden")} onClick={() => setSearchOpen((v) => !v)} aria-label="Search">
              {searchOpen ? <X className="h-5 w-5" /> : <Search className="h-5 w-5" />}
            </button>
            <ThemeToggle />
            <Link href="/wishlist" className={iconBtn} aria-label={`Wishlist, ${wishlist.size} items`}>
              <Heart className="h-5 w-5" />
              <CountBadge count={wishlist.size} />
            </Link>
            <Link href="/cart" className={iconBtn} aria-label={`Cart, ${cartCount} items`}>
              <ShoppingBag className="h-5 w-5" />
              <CountBadge count={cartCount} />
            </Link>
            <Link
              href="/account"
              className={cn(
                iconBtn,
                user && "bg-[#1E1E1E] text-white shadow-sm hover:bg-[#2C2A26] dark:bg-[#FDC841] dark:text-[#181715] dark:hover:bg-[#F5B82E]",
              )}
              aria-label={user ? `Account for ${user.name}` : "Sign in"}
            >
              {user ? (
                <span className="text-sm font-bold">{user.name.charAt(0).toUpperCase()}</span>
              ) : (
                <User className="h-5 w-5" />
              )}
            </Link>
          </div>
        </div>

        {searchOpen && (
          <div className="container pb-3 md:hidden">
            <Suspense>
              <SearchBox autoFocus onNavigate={() => setSearchOpen(false)} />
            </Suspense>
          </div>
        )}
      </header>

      {/* Mobile menu drawer: rendered outside the header */}
      <div
        className={cn("fixed inset-0 z-50 lg:hidden", menuOpen ? "pointer-events-auto" : "pointer-events-none")}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <div
          className={cn("absolute inset-0 bg-ink/40 dark:bg-black/60 backdrop-blur-sm transition-opacity", menuOpen ? "opacity-100" : "opacity-0")}
          onClick={() => setMenuOpen(false)}
        />
        <aside
          className={cn(
            "absolute inset-y-0 left-0 flex w-[86%] max-w-sm flex-col bg-white dark:bg-[#181715] dark:border-r dark:border-[#2C2924] shadow-2xl transition-transform duration-300",
            menuOpen ? "translate-x-0" : "-translate-x-full",
          )}
          role="dialog"
          aria-modal="true"
          aria-label="Menu"
        >
          <div className="flex items-center justify-between border-b border-ink-100 dark:border-[#2C2924] p-4">
            <Logo />
            <div className="flex items-center gap-1">
              <ThemeToggle />
              <button className={iconBtn} onClick={() => setMenuOpen(false)} aria-label="Close menu">
                <X className="h-5 w-5" />
              </button>
            </div>
          </div>
          <div className="flex-1 space-y-6 overflow-y-auto p-4">
            <Link href="/products" className="block rounded-2xl bg-brand-gradient p-4 text-[#181715] font-bold shadow-glow">
              <span className="block text-xs font-semibold uppercase tracking-widest opacity-80">Explore</span>
              <span className="text-lg font-bold">Shop all products</span>
            </Link>
            <div>
              <p className="mb-2 px-1 text-xs font-bold uppercase tracking-widest text-ink-400 dark:text-[#A39E93]">Categories</p>
              <ul className="space-y-1">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/categories/${c.slug}`}
                      className="flex items-center gap-3 rounded-2xl p-2 transition hover:bg-ink-50 dark:hover:bg-[#252320]"
                    >
                      <ProductArt art={c.art} name={c.name} className="h-10 w-10 rounded-xl" iconClassName="h-5 w-5" />
                      <span className="font-semibold text-ink dark:text-[#F5F3EF]">{c.name}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/wishlist" className="rounded-2xl border border-ink-100 dark:border-[#2C2924] p-3 text-sm font-semibold text-ink dark:text-[#F5F3EF]">
                Wishlist ({wishlist.size})
              </Link>
              <Link href="/account" className="rounded-2xl border border-ink-100 dark:border-[#2C2924] p-3 text-sm font-semibold text-ink dark:text-[#F5F3EF]">
                {user ? "My account" : "Sign in"}
              </Link>
            </div>
            {user?.role === "admin" && (
              <Link
                href="/admin/products"
                className="block text-center rounded-2xl bg-[#FDC841]/20 p-3 text-sm font-bold text-[#855000] dark:text-[#FDC841] hover:bg-[#FDC841]/30"
              >
                Admin Console
              </Link>
            )}
          </div>
        </aside>
      </div>
    </>
  );
}
