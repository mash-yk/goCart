import { Gift, RotateCcw, ShieldCheck, Sparkles, Truck, Zap } from "lucide-react";

const messages = [
  { icon: Truck, text: "Free shipping on orders over $75" },
  { icon: Zap, text: "Up to 25% off this week's deals" },
  { icon: RotateCcw, text: "30-day no-questions returns" },
  { icon: ShieldCheck, text: "2-year warranty on all tech" },
  { icon: Gift, text: "Members get early access to drops" },
  { icon: Sparkles, text: "New arrivals every Friday" },
];

export function AnnouncementBar() {
  const items = [...messages, ...messages];
  return (
    <div className="overflow-hidden bg-[#FAF3E0] py-2 text-[#7A4D00] border-b border-[#EFE3C3] dark:bg-[#181715] dark:text-[#EAE6DF] dark:border-[#2A2722] transition-colors duration-300">
      <div className="flex w-max animate-marquee gap-10 hover:[animation-play-state:paused]">
        {items.map(({ icon: Icon, text }, i) => (
          <span key={i} className="flex items-center gap-2 whitespace-nowrap text-xs font-semibold tracking-wide" aria-hidden={i >= messages.length}>
            <Icon className="h-3.5 w-3.5 text-[#D97706] dark:text-[#FDC841]" aria-hidden />
            {text}
          </span>
        ))}
      </div>
    </div>
  );
}
