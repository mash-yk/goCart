"use client";

import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils/cn";

interface QuantityStepperProps {
  value: number;
  min?: number;
  max: number;
  onChange: (value: number) => void;
  disabled?: boolean;
  size?: "sm" | "md";
  label?: string;
}

export function QuantityStepper({ value, min = 1, max, onChange, disabled, size = "md", label = "Quantity" }: QuantityStepperProps) {
  const h = size === "sm" ? "h-9" : "h-12";
  const btn = size === "sm" ? "w-9" : "w-11";
  return (
    <div
      className={cn("inline-flex items-center rounded-full border border-ink-200 bg-white dark:border-[#2C2924] dark:bg-[#1A1916]", h, disabled && "opacity-60")}
      role="group"
      aria-label={label}
    >
      <button
        type="button"
        className={cn("grid h-full place-items-center rounded-l-full text-ink-500 transition hover:text-brand-violet dark:text-[#A39E93] dark:hover:text-[#FDC841] disabled:opacity-30", btn)}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={disabled || value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="h-4 w-4" />
      </button>
      <output className="min-w-8 text-center text-sm font-bold tabular-nums text-ink dark:text-[#F5F3EF]" aria-live="polite">
        {value}
      </output>
      <button
        type="button"
        className={cn("grid h-full place-items-center rounded-r-full text-ink-500 transition hover:text-brand-violet dark:text-[#A39E93] dark:hover:text-[#FDC841] disabled:opacity-30", btn)}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={disabled || value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="h-4 w-4" />
      </button>
    </div>
  );
}
