import type { ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

interface EmptyStateProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        "relative flex flex-col items-center overflow-hidden rounded-4xl border border-dashed border-ink-200 bg-white px-6 py-16 text-center",
        className,
      )}
    >
      <div className="mesh-bg absolute inset-0 opacity-70" aria-hidden />
      <div className="relative mb-5 grid h-20 w-20 place-items-center rounded-3xl bg-brand-gradient text-white shadow-glow animate-float">
        {icon}
      </div>
      <h2 className="relative text-2xl font-bold tracking-tight">{title}</h2>
      <p className="relative mt-2 max-w-md text-ink-500">{description}</p>
      {action && <div className="relative mt-6 flex flex-wrap justify-center gap-3">{action}</div>}
    </div>
  );
}
