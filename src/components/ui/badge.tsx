import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "violet" | "pink" | "orange" | "lime" | "dark" | "neutral" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  violet: "bg-[#1E1E1E] text-white font-medium",
  pink: "bg-[#FDC841]/20 text-[#855000] border border-[#FDC841]/40 font-semibold",
  orange: "bg-[#FDC841] text-[#181715] font-bold shadow-sm",
  lime: "bg-[#FDC841] text-[#181715] font-bold shadow-sm",
  dark: "bg-[#1E1E1E] text-white font-medium shadow-sm",
  neutral: "bg-ink-100 text-ink-700",
  success: "bg-emerald-100/90 text-emerald-800 font-medium",
  warning: "bg-[#FEF3D6] text-[#855000] border border-[#FDE1A3] font-medium",
  danger: "bg-rose-100 text-rose-700 font-medium",
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
