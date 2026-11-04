import type { z } from "zod";
import { ValidationError } from "@/lib/errors";

/** Parses input with a Zod schema and throws a ValidationError listing each field problem. */
export function parseInput<S extends z.ZodType>(schema: S, input: unknown): z.output<S> {
  const result = schema.safeParse(input);
  if (!result.success) {
    const fieldErrors: Record<string, string> = {};
    for (const issue of result.error.issues) {
      const key = issue.path.map(String).join(".") || "_";
      if (!fieldErrors[key]) fieldErrors[key] = issue.message;
    }
    const first = Object.values(fieldErrors)[0] ?? "The request contains invalid data.";
    throw new ValidationError(first, { fieldErrors });
  }
  return result.data;
}
