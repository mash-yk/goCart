import Link from "next/link";
import { cn } from "@/lib/utils/cn";

export function Logo({ className, light = false }: { className?: string; light?: boolean }) {
  return (
    <Link href="/" className={cn("group inline-flex items-center gap-2.5", className)} aria-label="goCart home">
      <span className="relative grid h-9 w-9 place-items-center overflow-hidden rounded-xl bg-[#FDC841] text-[#181715] shadow-glow transition-transform duration-500 group-hover:-rotate-12">
        <svg
          viewBox="0 0 24 24"
          className="h-5 w-5 transition-transform duration-500 group-hover:translate-x-0.5"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M2.5 3h2.2l2.4 11.2a1.8 1.8 0 0 0 1.8 1.4h8.6a1.8 1.8 0 0 0 1.7-1.3L21 7.2H6" />
          <circle cx="9.5" cy="20" r="1.4" fill="currentColor" stroke="none" />
          <circle cx="17" cy="20" r="1.4" fill="currentColor" stroke="none" />
        </svg>
      </span>
      <span className={cn("text-xl font-black tracking-tight", light ? "text-white" : "text-ink dark:text-white")}>
        go<span className="text-[#D97706] dark:text-[#FDC841]">Cart</span>
      </span>
    </Link>
  );
}
