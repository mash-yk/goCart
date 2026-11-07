import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="Lumora home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#FDC841] text-[#181715] shadow-glow transition-transform duration-500 group-hover:rotate-[15deg]">
        <svg viewBox="0 0 24 24" className="h-5 w-5 text-[#181715]" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" aria-hidden>
          <path d="M7 4v13h10" />
          <circle cx="17" cy="7" r="2.2" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={cn("text-xl font-black tracking-tight", light ? "text-white" : "text-ink dark:text-white")}>
        lumora<span className="text-[#FDC841]">.</span>
      </span>
    </Link>
  );
}
