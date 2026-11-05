import type { HTMLAttributes } from "react";
import { cn } from "@/lib/utils/cn";

type Tone = "violet" | "pink" | "orange" | "lime" | "dark" | "neutral" | "success" | "warning" | "danger";

const tones: Record<Tone, string> = {
  violet: "bg-violet-100 text-violet-700",
  pink: "bg-fuchsia-100 text-fuchsia-700",
  orange: "bg-orange-100 text-orange-700",
  lime: "bg-lime-300 text-ink",
  dark: "bg-ink text-white",
  neutral: "bg-ink-100 text-ink-700",
  success: "bg-emerald-100 text-emerald-700",
  warning: "bg-amber-100 text-amber-800",
  danger: "bg-rose-100 text-rose-700",
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
