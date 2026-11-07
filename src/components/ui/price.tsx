import { cn } from "@/lib/utils/cn";
import { formatPrice } from "@/lib/utils/format";

export function Price({
  price,
  compareAtPrice,
  size = "md",
  className,
}: {
  price: number;
  compareAtPrice?: number;
  size?: "sm" | "md" | "lg";
  className?: string;
}) {
  const onSale = compareAtPrice !== undefined && compareAtPrice > price;
  return (
    <div className={cn("flex items-baseline gap-2", className)}>
      <span
        className={cn(
          "font-bold tracking-tight",
          size === "sm" && "text-base",
          size === "md" && "text-lg",
          size === "lg" && "text-3xl sm:text-4xl",
          onSale && "text-[#D97706]",
        )}
      >
        {formatPrice(price)}
      </span>
      {onSale && (
        <span className={cn("text-ink-400 line-through", size === "lg" ? "text-lg" : "text-sm")}>
          <span className="sr-only">Was </span>
          {formatPrice(compareAtPrice!)}
        </span>
      )}
    </div>
  );
}
