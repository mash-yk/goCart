import Link from "next/link";
import { Github, Instagram, Twitter, Youtube } from "lucide-react";
import { Logo } from "./logo";
import type { Category } from "@/types";

export function Footer({ categories }: { categories: Category[] }) {
  const year = new Date().getFullYear();
  return (
    <footer className="relative mt-24 overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -top-40 left-1/2 h-80 w-[60rem] -translate-x-1/2 rounded-full bg-brand-gradient opacity-30 blur-3xl" aria-hidden />
      <div className="container relative grid gap-10 py-16 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo light />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-ink-200">
            Lumora curates bold, beautifully made tech and lifestyle gear for people who want their everyday to glow a little brighter.
          </p>
          <div className="mt-6 flex gap-2">
            {[Instagram, Twitter, Youtube, Github].map((Icon, i) => (
              <span key={i} className="grid h-10 w-10 place-items-center rounded-full bg-white/10 transition hover:bg-white/20" aria-hidden>
                <Icon className="h-4 w-4" />
              </span>
            ))}
          </div>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-300">Shop</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li>
              <Link href="/products" className="text-ink-100 hover:text-white">
                All products
              </Link>
            </li>
            {categories.map((c) => (
              <li key={c.slug}>
                <Link href={`/categories/${c.slug}`} className="text-ink-100 hover:text-white">
                  {c.name}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-300">Your stuff</h3>
          <ul className="mt-4 space-y-2.5 text-sm">
            <li><Link href="/cart" className="text-ink-100 hover:text-white">Cart</Link></li>
            <li><Link href="/wishlist" className="text-ink-100 hover:text-white">Wishlist</Link></li>
            <li><Link href="/account" className="text-ink-100 hover:text-white">Account</Link></li>
            <li><Link href="/products?onSale=true" className="text-ink-100 hover:text-white">Deals</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-sm font-bold uppercase tracking-widest text-ink-300">Promise</h3>
          <ul className="mt-4 space-y-2.5 text-sm text-ink-100">
            <li>Free shipping over $75</li>
            <li>30-day returns</li>
            <li>2-year warranty</li>
            <li>Secure checkout</li>
          </ul>
        </div>
      </div>
      <div className="border-t border-white/10">
        <div className="container flex flex-col gap-2 py-6 text-xs text-ink-300 sm:flex-row sm:justify-between">
          <p>© {year} Lumora. All rights reserved.</p>
          <p>Built with Next.js, TypeScript, Tailwind CSS and AWS DynamoDB.</p>
        </div>
      </div>
    </footer>
  );
}
