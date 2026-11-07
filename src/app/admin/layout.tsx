import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Lock, ShieldCheck } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { buttonClasses } from "@/components/ui/button";
import { getCurrentUser } from "@/lib/auth/session";

export const metadata: Metadata = {
  title: "Admin Console | Lumora",
  robots: { index: false },
};

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();

  if (!user) {
    return (
      <div className="container max-w-md py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-[#FEF3D6] text-[#855000]">
          <Lock className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-ink">Admin Sign-in Required</h1>
        <p className="mt-2 text-sm text-ink-500">
          You must be signed in with an authorized administrator account to view the product management dashboard.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/account" className={buttonClasses("primary", "md", "w-full")}>
            Go to Sign In
          </Link>
          <Link href="/" className={buttonClasses("outline", "md", "w-full")}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  if (user.role !== "admin") {
    return (
      <div className="container max-w-md py-20 text-center">
        <div className="mx-auto grid h-16 w-16 place-items-center rounded-2xl bg-rose-100 text-rose-600">
          <ShieldCheck className="h-8 w-8" />
        </div>
        <h1 className="mt-4 text-2xl font-black text-ink">Admin Access Denied</h1>
        <p className="mt-2 text-sm text-ink-500">
          Signed in as <strong className="text-ink">{user.email}</strong>, which does not have administrator privileges.
        </p>
        <p className="mt-2 text-xs text-ink-400">
          To grant admin privileges, add this email to <code className="bg-ink-100 px-1 py-0.5 rounded">ADMIN_EMAILS</code> in <code className="bg-ink-100 px-1 py-0.5 rounded">.env.local</code>.
        </p>
        <div className="mt-6 flex flex-col gap-2">
          <Link href="/account" className={buttonClasses("primary", "md", "w-full")}>
            Manage Account
          </Link>
          <Link href="/" className={buttonClasses("outline", "md", "w-full")}>
            Return to Store
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50/40">
      {/* Admin Subheader Bar */}
      <div className="border-b border-ink-100 bg-white">
        <div className="container flex h-14 items-center justify-between">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="flex items-center gap-1.5 text-xs font-semibold text-ink-500 hover:text-ink transition"
            >
              <ArrowLeft className="h-3.5 w-3.5" /> Back to Storefront
            </Link>
            <span className="text-ink-200">|</span>
            <div className="flex items-center gap-1.5">
              <Badge tone="dark">
                <ShieldCheck className="h-3 w-3 mr-0.5 text-[#FDC841]" /> Admin Console
              </Badge>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span className="text-xs text-ink-500 hidden sm:inline">
              Admin: <strong className="text-ink">{user.name}</strong> ({user.email})
            </span>
          </div>
        </div>
      </div>

      <main className="container py-8 sm:py-10">{children}</main>
    </div>
  );
}

