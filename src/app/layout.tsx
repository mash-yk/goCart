import type { Metadata, Viewport } from "next";
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
import { unstable_rethrow } from "next/navigation";
import { Toaster } from "sonner";
import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";
import { StoreProvider } from "@/components/providers/store-provider";
import { getCurrentUser, getOwner } from "@/lib/auth/session";
import { cartService } from "@/lib/services/cart.service";
import { catalogService } from "@/lib/services/catalog.service";
import { wishlistService } from "@/lib/services/wishlist.service";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Lumora: Tech & lifestyle gear that glows up your everyday",
    template: "%s | Lumora",
  },
  description:
    "Shop bold, beautifully made headphones, wearables, smart home gadgets, workspace upgrades, travel bags and fitness gear at Lumora.",
  openGraph: {
    title: "Lumora",
    description: "Tech & lifestyle gear that glows up your everyday.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#FAF8F3",
};

/**
 * Loads the data every page needs (user, cart count, wishlist) once on the server.
 * If the database is unreachable the shell still renders, and pages show their own errors.
 */
async function loadShellData() {
  try {
    const [user, owner] = await Promise.all([getCurrentUser(), getOwner()]);
    const [cartCount, wishlist, categories] = await Promise.all([
      cartService.getItemCount(owner),
      wishlistService.getProductSlugs(owner),
      catalogService.getCategories(),
    ]);
    return { user, cartCount, wishlist, categories };
  } catch (error) {
    unstable_rethrow(error); // let Next.js handle its own control-flow errors (dynamic rendering, redirects)
    console.error("[layout] failed to load shell data", error);
    return { user: null, cartCount: 0, wishlist: [] as string[], categories: [] };
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const { user, cartCount, wishlist, categories } = await loadShellData();

  return (
    <html lang="en" className={`${GeistSans.variable} ${GeistMono.variable}`}>
      <body className="flex min-h-screen flex-col font-sans">
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[100] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-white"
        >
          Skip to content
        </a>
        <StoreProvider initialUser={user} initialCartCount={cartCount} initialWishlist={wishlist}>
          <Header />
          <main id="main" className="flex-1">
            {children}
          </main>
          <Footer categories={categories} />
          <Toaster position="bottom-right" richColors closeButton toastOptions={{ style: { borderRadius: "1rem" } }} />
        </StoreProvider>
      </body>
    </html>
  );
}
