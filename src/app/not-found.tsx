import Link from "next/link";
import { Compass, Home } from "lucide-react";
import { buttonClasses } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="relative overflow-hidden">
      <div className="mesh-bg absolute inset-0" aria-hidden />
      <div className="container relative flex min-h-[70vh] flex-col items-center justify-center py-20 text-center">
        <div className="relative">
          <p className="text-gradient animate-gradient-x select-none text-[9rem] font-black leading-none tracking-tighter sm:text-[14rem]">404</p>
          <span className="absolute -right-4 top-6 grid h-16 w-16 animate-float place-items-center rounded-2xl bg-lime-300 text-ink shadow-card sm:h-20 sm:w-20">
            <Compass className="h-8 w-8 sm:h-10 sm:w-10" />
          </span>
        </div>
        <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">This page wandered off.</h1>
        <p className="mt-3 max-w-md text-ink-500">
          The link may be broken or the product may have sold out for good. Let&apos;s get you back to the good stuff.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link href="/" className={buttonClasses("primary", "lg")}>
            <Home className="h-5 w-5" /> Back home
          </Link>
          <Link href="/products" className={buttonClasses("outline", "lg")}>
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}
