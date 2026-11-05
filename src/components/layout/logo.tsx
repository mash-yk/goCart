import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2", className)} aria-label="Lumora home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-brand-gradient shadow-glow transition-transform duration-500 group-hover:rotate-[20deg]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-white" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" aria-hidden>
          <path d="M7 4v13h10" />
          <circle cx="17" cy="7" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={cn("text-xl font-black tracking-tight", light ? "text-white" : "text-ink")}>
        lumora<span className="text-gradient">.</span>
      </span>
    </Link>
  );
}
