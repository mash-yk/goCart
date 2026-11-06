"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Lock, Mail, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import type { ZodType } from "zod";
import { useStore } from "@/components/providers/store-provider";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ApiClientError, apiFetch, errorMessage } from "@/lib/client/api";
import { cn } from "@/lib/utils/cn";
import { signInSchema, signUpSchema } from "@/lib/validation/schemas";
import type { PublicUser } from "@/types";

type Mode = "signin" | "signup";
type Fields = { name: string; email: string; password: string };

function fieldErrorsFrom<T>(schema: ZodType<T>, values: unknown): Record<string, string> {
  const result = schema.safeParse(values);
  if (result.success) return {};
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const key = String(issue.path[0] ?? "form");
    errors[key] ??= issue.message;
  }
  return errors;
}

function passwordStrength(pw: string) {
  let score = 0;
  if (pw.length >= 8) score++;
  if (pw.length >= 12) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^a-zA-Z0-9]/.test(pw)) score++;
  return Math.min(4, score);
}

export function AuthForms({ next }: { next: string }) {
  const router = useRouter();
  const { setUser } = useStore();
  const [mode, setMode] = useState<Mode>("signin");
  const [values, setValues] = useState<Fields>({ name: "", email: "", password: "" });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [formError, setFormError] = useState<string>();

  const schema = mode === "signup" ? signUpSchema : signInSchema;
  const payload = mode === "signup" ? values : { email: values.email, password: values.password };

  function set<K extends keyof Fields>(key: K, value: string) {
    const nextValues = { ...values, [key]: value };
    setValues(nextValues);
    if (touched[key]) {
      const all = fieldErrorsFrom(schema, mode === "signup" ? nextValues : { email: nextValues.email, password: nextValues.password });
      setErrors((e) => ({ ...e, [key]: all[key] ?? "" }));
    }
  }

  function blur(key: keyof Fields) {
    setTouched((t) => ({ ...t, [key]: true }));
    setErrors((e) => ({ ...e, [key]: fieldErrorsFrom(schema, payload)[key] ?? "" }));
  }

  function switchMode(m: Mode) {
    setMode(m);
    setErrors({});
    setTouched({});
    setFormError(undefined);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    const clientErrors = fieldErrorsFrom(schema, payload);
    setTouched({ name: true, email: true, password: true });
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setLoading(true);
    setFormError(undefined);
    try {
      const { user } = await apiFetch<{ user: PublicUser }>(`/api/auth/${mode}`, { method: "POST", json: payload });
      setUser(user);
      toast.success(mode === "signup" ? `Welcome to Lumora, ${user.name.split(" ")[0]}!` : `Welcome back, ${user.name.split(" ")[0]}!`);
      router.replace(next);
      router.refresh();
    } catch (error) {
      if (error instanceof ApiClientError && Object.keys(error.fieldErrors).length > 0) setErrors(error.fieldErrors);
      setFormError(errorMessage(error));
    } finally {
      setLoading(false);
    }
  }

  const strength = passwordStrength(values.password);

  return (
    <div className="card mx-auto w-full max-w-md p-6 sm:p-8">
      <div className="relative mb-8 grid grid-cols-2 rounded-full bg-ink-50 p-1" role="tablist" aria-label="Account">
        <span
          aria-hidden
          className={cn(
            "absolute inset-y-1 left-1 w-[calc(50%-4px)] rounded-full bg-white shadow-card transition-transform duration-300",
            mode === "signup" && "translate-x-full",
          )}
        />
        {(["signin", "signup"] as const).map((m) => (
          <button
            key={m}
            type="button"
            role="tab"
            aria-selected={mode === m}
            onClick={() => switchMode(m)}
            className={cn("relative z-10 h-11 rounded-full text-sm font-bold transition", mode === m ? "text-ink" : "text-ink-400")}
          >
            {m === "signin" ? "Sign in" : "Create account"}
          </button>
        ))}
      </div>

      <form onSubmit={onSubmit} noValidate className="space-y-4">
        {mode === "signup" && (
          <Input
            label="Full name"
            name="name"
            autoComplete="name"
            icon={<UserIcon className="h-4 w-4" />}
            value={values.name}
            onChange={(e) => set("name", e.target.value)}
            onBlur={() => blur("name")}
            error={errors.name || undefined}
            placeholder="Alex Rivera"
          />
        )}
        <Input
          label="Email"
          name="email"
          type="email"
          autoComplete="email"
          icon={<Mail className="h-4 w-4" />}
          value={values.email}
          onChange={(e) => set("email", e.target.value)}
          onBlur={() => blur("email")}
          error={errors.email || undefined}
          placeholder="you@example.com"
        />
        <div className="relative">
          <Input
            label="Password"
            name="password"
            type={showPassword ? "text" : "password"}
            autoComplete={mode === "signup" ? "new-password" : "current-password"}
            icon={<Lock className="h-4 w-4" />}
            value={values.password}
            onChange={(e) => set("password", e.target.value)}
            onBlur={() => blur("password")}
            error={errors.password || undefined}
            hint={mode === "signup" ? "At least 8 characters, with a letter and a number." : undefined}
            className="pr-12"
          />
          <button
            type="button"
            onClick={() => setShowPassword((s) => !s)}
            className="absolute right-2 top-[30px] grid h-10 w-10 place-items-center rounded-full text-ink-400 hover:text-ink"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {mode === "signup" && values.password && (
          <div className="flex items-center gap-2" aria-live="polite">
            <div className="flex flex-1 gap-1">
              {[0, 1, 2, 3].map((i) => (
                <span
                  key={i}
                  className={cn(
                    "h-1.5 flex-1 rounded-full transition-colors",
                    i < strength ? ["bg-rose-400", "bg-amber-400", "bg-lime-400", "bg-emerald-500"][strength - 1] : "bg-ink-100",
                  )}
                />
              ))}
            </div>
            <span className="text-xs font-semibold text-ink-500">{["Too weak", "Weak", "Okay", "Good", "Strong"][strength]}</span>
          </div>
        )}

        {formError && (
          <p role="alert" className="rounded-2xl bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">
            {formError}
          </p>
        )}

        <Button type="submit" size="lg" className="w-full" loading={loading}>
          {mode === "signin" ? "Sign in" : "Create account"}
        </Button>
        <p className="text-center text-xs text-ink-400">
          Your cart and wishlist come with you when you {mode === "signin" ? "sign in" : "sign up"}.
        </p>
      </form>
    </div>
  );
}
