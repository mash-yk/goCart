"use client";

import { useState } from "react";
import { CheckCircle2, Mail } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { apiFetch, errorMessage } from "@/lib/client/api";
import { newsletterSchema } from "@/lib/validation/schemas";

export function NewsletterForm() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState<string>();
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = newsletterSchema.safeParse({ email });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message);
      return;
    }
    setError(undefined);
    setLoading(true);
    try {
      const res = await apiFetch<{ alreadySubscribed: boolean }>("/api/newsletter", {
        method: "POST",
        json: parsed.data,
      });
      setDone(true);
      toast.success(res.alreadySubscribed ? "You're already on the list. Thanks!" : "You're in! Check your inbox soon.");
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <p className="flex items-center gap-2 rounded-full bg-white/15 px-5 py-3 font-semibold">
        <CheckCircle2 className="h-5 w-5" /> Thanks for subscribing!
      </p>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="w-full max-w-md">
      <div className="flex gap-2 rounded-full bg-white dark:bg-[#252320] border border-[#E5DAC0] dark:border-[#38342D] p-1.5 shadow-card">
        <label htmlFor="newsletter-email" className="sr-only">
          Email address
        </label>
        <div className="relative flex-1">
          <Mail className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-ink-400 dark:text-[#A39E93]" />
          <input
            id="newsletter-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            aria-invalid={Boolean(error) || undefined}
            aria-describedby={error ? "newsletter-error" : undefined}
            className="h-11 w-full rounded-full bg-transparent pl-10 pr-3 text-sm text-ink dark:text-[#F5F3EF] placeholder:text-ink-400 dark:placeholder:text-[#7A756C] focus:outline-none"
          />
        </div>
        <Button type="submit" variant="primary" loading={loading} className="px-5">
          Subscribe
        </Button>
      </div>
      {error && (
        <p id="newsletter-error" role="alert" className="mt-2 pl-4 text-sm font-semibold text-rose-600 dark:text-rose-400">
          {error}
        </p>
      )}
    </form>
  );
}
