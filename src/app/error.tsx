"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RefreshCw, TriangleAlert } from "lucide-react";
import { Button, buttonClasses } from "@/components/ui/button";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="container flex min-h-[60vh] flex-col items-center justify-center py-20 text-center">
      <div className="grid h-20 w-20 place-items-center rounded-3xl bg-rose-100 text-rose-600">
        <TriangleAlert className="h-10 w-10" />
      </div>
      <h1 className="mt-6 text-3xl font-black tracking-tight sm:text-4xl">Something went sideways.</h1>
      <p className="mt-3 max-w-md text-ink-500">
        We couldn&apos;t load this page right now. It&apos;s probably a temporary hiccup, so give it another go.
      </p>
      {error.digest && <p className="mt-2 font-mono text-xs text-ink-400">Reference: {error.digest}</p>}
      <div className="mt-8 flex flex-wrap justify-center gap-3">
        <Button size="lg" onClick={reset}>
          <RefreshCw className="h-5 w-5" /> Try again
        </Button>
        <Link href="/" className={buttonClasses("outline", "lg")}>
          Go home
        </Link>
      </div>
    </div>
  );
}
