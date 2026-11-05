import { Star } from "lucide-react";
import { cn } from "@/lib/utils/cn";
import { formatCompactNumber } from "@/lib/utils/format";

export function Rating({
  value,
  count,
  size = "sm",
  className,
}: {
  value: number;
  count?: number;
  size?: "sm" | "md";
  className?: string;
}) {
  const icon = size === "sm" ? "h-3.5 w-3.5" : "h-[18px] w-[18px]";
  return (
    <div className={cn("flex items-center gap-1.5", className)}>
      <div className="flex" aria-label={`Rated ${value.toFixed(1)} out of 5`} role="img">
        {Array.from({ length: 5 }).map((_, i) => {
          const fill = Math.max(0, Math.min(1, value - i));
          return (
            <span key={i} className={cn("relative", icon)}>
              <Star className={cn("absolute inset-0 text-ink-200", icon)} fill="currentColor" strokeWidth={0} />
              <span className="absolute inset-0 overflow-hidden" style={{ width: `${fill * 100}%` }}>
                <Star className={cn("text-amber-400", icon)} fill="currentColor" strokeWidth={0} />
              </span>
            </span>
          );
        })}
      </div>
      <span className={cn("font-semibold text-ink", size === "sm" ? "text-xs" : "text-sm")}>{value.toFixed(1)}</span>
      {count !== undefined && (
        <span className={cn("text-ink-400", size === "sm" ? "text-xs" : "text-sm")}>({formatCompactNumber(count)})</span>
      )}
    </div>
  );
}
