import { Sparkle } from "lucide-react";

const words = [
  "Noise cancelling",
  "Smart home",
  "Ergonomic",
  "Carry-on ready",
  "Fitness tracking",
  "Wireless",
  "Studio sound",
  "Built to last",
];

export function BrandMarquee() {
  return (
    <div className="relative -rotate-1 overflow-hidden bg-[#1E1E1E] py-4 text-[#FAF8F3] shadow-sm border-y border-black/10" aria-hidden>
      <div className="flex w-max animate-marquee gap-8 whitespace-nowrap">
        {[...words, ...words].map((w, i) => (
          <span key={i} className="flex items-center gap-8 text-xl font-extrabold uppercase tracking-tight sm:text-2xl">
            {w}
            <Sparkle className="h-5 w-5 fill-[#FDC841] text-[#FDC841]" />
          </span>
        ))}
      </div>
    </div>
  );
}
