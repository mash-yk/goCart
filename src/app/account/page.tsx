import type { Metadata } from "next";
import { Heart, ShoppingBag, Sparkles } from "lucide-react";
import { AccountPanel } from "@/components/account/account-panel";
import { AuthForms } from "@/components/account/auth-forms";
import { getCurrentUser, getOwner } from "@/lib/auth/session";
import { cartService } from "@/lib/services/cart.service";
import { wishlistService } from "@/lib/services/wishlist.service";

export const metadata: Metadata = { title: "Your account", robots: { index: false } };
export const dynamic = "force-dynamic";

/** Only allow redirects back into this site, never to another origin. */
function safeNext(value: string | string[] | undefined) {
  const v = Array.isArray(value) ? value[0] : value;
  return v && v.startsWith("/") && !v.startsWith("//") ? v : "/account";
}

export default async function AccountPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const [user, sp] = await Promise.all([getCurrentUser(), searchParams]);

  if (user) {
    const owner = await getOwner();
    const [cartCount, wishlist] = await Promise.all([cartService.getItemCount(owner), wishlistService.getProductSlugs(owner)]);
    return (
      <div className="container py-8 sm:py-12">
        <h1 className="mb-8 text-4xl font-black tracking-tight sm:text-5xl">
          Hey, <span className="text-gradient">{user.name.split(" ")[0]}</span> 👋
        </h1>
        <AccountPanel user={user} cartCount={cartCount} wishlistCount={wishlist.length} />
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden">
      <div className="mesh-bg absolute inset-0" aria-hidden />
      <div className="container relative grid items-center gap-12 py-12 sm:py-20 lg:grid-cols-2">
        <div className="max-w-lg">
          <h1 className="text-4xl font-black leading-tight tracking-tight sm:text-6xl">
            Your <span className="text-gradient">Lumora</span> account.
          </h1>
          <p className="mt-4 text-lg text-ink-500">Sign in to keep your cart and wishlist synced across every device.</p>
          <ul className="mt-8 space-y-4">
            {[
              { icon: ShoppingBag, text: "Pick up your cart where you left off" },
              { icon: Heart, text: "Save favourites to your wishlist" },
              { icon: Sparkles, text: "Early access to new drops and deals" },
            ].map(({ icon: Icon, text }) => (
              <li key={text} className="flex items-center gap-3 font-medium">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white text-brand-violet shadow-card">
                  <Icon className="h-5 w-5" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>
        <AuthForms next={safeNext(sp.next)} />
      </div>
    </div>
  );
}
