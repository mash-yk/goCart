import Link from "next/link";
import { Github, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "./logo";
import type { Category } from "@/types";

export function Footer({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 overflow-hidden bg-[#F3ECE0] text-ink border-t border-[#E5DAC0] dark:bg-[#161513] dark:text-[#FAF8F3] dark:border-white/10 transition-colors duration-300">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-[#FDC841]/15 dark:bg-[#FDC841]/10 opacity-40 blur-3xl" aria-hidden />
      <div className="container relative grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-600 dark:text-[#CDC4B3]">
            Lumora curates aesthetic, beautifully engineered tech and lifestyle gear designed with timeless warmth and precision.
          </p>
          <div className="mt-6 flex gap-2">
            {[Instagram, Twitter, Youtube, Github].map((Icon, i) => (
              <span key={i} className="grid h-10 w-10 place-items-center rounded-full bg-black/5 hover:bg-black/10 text-ink dark:bg-white/10 dark:hover:bg-white/20 dark:text-[#FAF8F3] transition" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#855000] dark:text-[#FDC841]">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/products" className="text-ink-600 hover:text-ink dark:text-[#CDC4B3] dark:hover:text-white transition">
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="text-ink-600 hover:text-ink dark:text-[#CDC4B3] dark:hover:text-white transition">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#855000] dark:text-[#FDC841]">Your stuff</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/cart" className="text-ink-600 hover:text-ink dark:text-[#CDC4B3] dark:hover:text-white transition">Cart</Link></li>
            <li><Link href="/wishlist" className="text-ink-600 hover:text-ink dark:text-[#CDC4B3] dark:hover:text-white transition">Wishlist</Link></li>
            <li><Link href="/account" className="text-ink-600 hover:text-ink dark:text-[#CDC4B3] dark:hover:text-white transition">Account</Link></li>
            <li><Link href="/products?onSale=true" className="text-ink-600 hover:text-ink dark:text-[#CDC4B3] dark:hover:text-white transition">Deals</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-widest text-[#855000] dark:text-[#FDC841]">Promise</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-600 dark:text-[#CDC4B3]">
            <li>Free shipping over $75</li>
            <li>30-day returns</li>
            <li>2-year warranty</li>
            <li>Secure checkout</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-black/10 dark:border-white/10 py-6 text-center text-xs text-ink-500 dark:text-[#9C9281]">
        <p>&copy; {year} Lumora Inc. All rights reserved.</p>
      </div>
    </footer>
  );
}
