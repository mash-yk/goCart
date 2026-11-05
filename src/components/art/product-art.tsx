import Image from "next/image";
import type { Art } from "@/types";
import { cn } from "@/lib/utils/cn";
import { artIcon } from "./icons";

/** Four compositions so the product gallery can show different "angles" of the same art. */
const VARIANTS = [
  { glow: "30% 20%", rotate: -8, scale: 1, pattern: "dots" },
  { glow: "75% 25%", rotate: 10, scale: 1.18, pattern: "rings" },
  { glow: "25% 80%", rotate: -16, scale: 0.9, pattern: "grid" },
  { glow: "70% 75%", rotate: 4, scale: 1.08, pattern: "stripes" },
] as const;

const PATTERNS: Record<(typeof VARIANTS)[number]["pattern"], string> = {
  dots: "radial-gradient(rgba(255,255,255,0.35) 1.2px, transparent 1.2px)",
  rings: "repeating-radial-gradient(circle at 50% 50%, rgba(255,255,255,0.12) 0 2px, transparent 2px 22px)",
  grid: "linear-gradient(rgba(255,255,255,0.14) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.14) 1px, transparent 1px)",
  stripes: "repeating-linear-gradient(45deg, rgba(255,255,255,0.10) 0 10px, transparent 10px 22px)",
};

interface ProductArtProps {
  art: Art;
  name: string;
  /** Optional real photo; shown instead of generated art when present. */
  image?: string;
  variant?: number;
  className?: string;
  iconClassName?: string;
  priority?: boolean;
  sizes?: string;
}

/**
 * Generated product artwork: a vibrant gradient tile with the product's icon.
 * Pure CSS + SVG icons, so it renders instantly with no network requests.
 */
export function ProductArt({
  art,
  name,
  image,
  variant = 0,
  className,
  iconClassName,
  priority,
  sizes = "(min-width: 1024px) 25vw, 50vw",
}: ProductArtProps) {
  if (image) {
    return (
      <div className={cn("relative aspect-square overflow-hidden", className)}>
        <Image src={image} alt={name} fill sizes={sizes} priority={priority} className="object-cover" />
      </div>
    );
  }

  const v = VARIANTS[Math.abs(variant) % VARIANTS.length]!;
  const Icon = artIcon(art.icon);

  return (
    <div
      role="img"
      aria-label={name}
      className={cn("relative isolate grid aspect-square place-items-center overflow-hidden", className)}
      style={{
        backgroundImage: `radial-gradient(circle at ${v.glow}, rgba(255,255,255,0.45), transparent 55%), linear-gradient(135deg, ${art.from}, ${art.to})`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 opacity-70"
        style={{ backgroundImage: PATTERNS[v.pattern], backgroundSize: v.pattern === "dots" ? "18px 18px" : v.pattern === "grid" ? "28px 28px" : undefined }}
      />
      <div aria-hidden className="absolute -right-[15%] -top-[15%] h-[55%] w-[55%] rounded-full bg-white/25 blur-2xl" />
      <div aria-hidden className="absolute -bottom-[20%] -left-[10%] h-[60%] w-[60%] rounded-full blur-3xl" style={{ background: art.to, opacity: 0.6 }} />
      <div aria-hidden className="absolute h-[72%] w-[72%] rounded-full border border-white/30" />
      <div aria-hidden className="absolute h-[54%] w-[54%] rounded-full bg-white/15 shadow-[inset_0_2px_20px_rgba(255,255,255,0.35)] backdrop-blur-sm" />
      <Icon
        aria-hidden
        className={cn("relative h-[36%] w-[36%] text-white drop-shadow-[0_14px_24px_rgba(20,11,46,0.35)]", iconClassName)}
        strokeWidth={1.35}
        style={{ transform: `rotate(${v.rotate}deg) scale(${v.scale})` }}
      />
    </div>
  );
}
