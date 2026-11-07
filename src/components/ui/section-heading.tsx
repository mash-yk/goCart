import Link from "next/link";
import { ArrowRight } from "lucide-react";
import type { ReactNode } from "react";

export function SectionHeading({
  eyebrow,
  title,
  description,
  href,
  linkLabel = "View all",
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: string;
  href?: string;
  linkLabel?: string;
}) {
  return (
    <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div className="max-w-2xl">
        {eyebrow && (
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-[#855000] dark:text-[#FDC841]">{eyebrow}</p>
        )}
        <h2 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-ink dark:text-[#F5F3EF]">{title}</h2>
        {description && <p className="mt-2 text-ink-500 dark:text-[#A39E93]">{description}</p>}
      </div>
      {href && (
        <Link
          href={href}
          className="group inline-flex items-center gap-1.5 text-sm font-semibold text-ink hover:text-[#855000] dark:text-[#F5F3EF] dark:hover:text-[#FDC841]"
        >
          {linkLabel}
          <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Link>
      )}
    </div>
  );
}
