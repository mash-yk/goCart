import { forwardRef, useId, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils/cn";

export interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  icon?: ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(function Input(
  { label, error, hint, icon, className, id, ...props },
  ref,
) {
  const generatedId = useId();
  const inputId = id ?? generatedId;
  const describedBy = error ? `${inputId}-error` : hint ? `${inputId}-hint` : undefined;

  return (
    <div className="space-y-1.5">
      {label && (
        <label htmlFor={inputId} className="block text-sm font-semibold text-ink dark:text-[#F5F3EF]">
          {label}
        </label>
      )}
      <div className="relative">
        {icon && (
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-ink-400 dark:text-[#A39E93]">{icon}</span>
        )}
        <input
          ref={ref}
          id={inputId}
          aria-invalid={Boolean(error) || undefined}
          aria-describedby={describedBy}
          className={cn(
            "h-12 w-full rounded-2xl border bg-white px-4 text-sm text-ink placeholder:text-ink-400 transition focus:border-[#F5B82E] focus:outline-none focus:ring-4 focus:ring-[#FDC841]/25 dark:border-[#2C2924] dark:bg-[#1A1916] dark:text-[#F5F3EF] dark:placeholder:text-[#7A756C] dark:focus:border-[#FDC841]",
            icon && "pl-11",
            error ? "border-rose-400 focus:border-rose-500 focus:ring-rose-500/15" : "border-[#E5DED0]",
            className,
          )}
          {...props}
        />
      </div>
      {error ? (
        <p id={`${inputId}-error`} className="text-xs font-medium text-rose-600 dark:text-rose-400" role="alert">
          {error}
        </p>
      ) : hint ? (
        <p id={`${inputId}-hint`} className="text-xs text-ink-400 dark:text-[#A39E93]">
          {hint}
        </p>
      ) : null}
    </div>
  );
});
