import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "violet" | "pink" | "orange" | "lime" | "dark" | "neutral" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  violet: "bg-[#1E1E1E] text-white font-medium",
  pink: "bg-[#FDC841]/20 text-[#855000] border border-[#FDC841]/40 font-semibold dark:text-[#FDC841] dark:border-[#FDC841]/30",
  orange: "bg-[#FDC841] text-[#181715] font-bold shadow-sm",
  lime: "bg-[#FDC841] text-[#181715] font-bold shadow-sm",
  dark: "bg-[#1E1E1E] text-white font-medium shadow-sm dark:bg-[#2A2824] dark:border dark:border-[#38342D]",
  neutral: "bg-ink-100 text-ink-700 dark:bg-[#252320] dark:text-[#E6E1D8]",
  success: "bg-emerald-100/90 text-emerald-800 font-medium dark:bg-emerald-950/40 dark:text-emerald-300",
  warning: "bg-[#FEF3D6] text-[#855000] border border-[#FDE1A3] font-medium dark:bg-[#252219] dark:text-[#FDC841] dark:border-[#FDC841]/30",
  danger: "bg-rose-100 text-rose-700 font-medium dark:bg-rose-950/40 dark:text-rose-300",
};

export function Badge({ tone = "violet", className, ...props }: HTMLAttributes<HTMLSpanElement> & { tone?: Tone }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-semibold tracking-wide",
        tones[tone],
        className,
      )}
      {...props}
    />
  );
}
