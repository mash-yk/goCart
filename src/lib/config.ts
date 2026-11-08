import "server-only";
import { z } from "zod";

/**
 * Server-side configuration, validated once on first use.
 * Values come from environment variables only; nothing sensitive is hard-coded.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  DATABASE_URL: z.string().optional(),
  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
  STRIPE_SECRET_KEY: z.string().optional(),
  STRIPE_WEBHOOK_SECRET: z.string().optional(),
  CRON_SECRET: z.string().optional(),
});

export type AppConfig = {
  env: "development" | "test" | "production";
  databaseUrl: string;
  authSecret: Uint8Array;
  adminEmails: string[];
  stripe: { secretKey?: string; webhookSecret?: string };
  cronSecret?: string;
};

let cached: AppConfig | null = null;

const DEV_ONLY_SECRET = "gocart-dev-only-secret-change-me-0123456789";

export function getConfig(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  const env = parsed.data;

  const isProd = env.NODE_ENV === "production";
  // `next build` runs with NODE_ENV=production, so only enforce runtime settings at request time.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";

  if (!env.DATABASE_URL && !isBuildPhase) {
    throw new Error("DATABASE_URL is not set. Add your PostgreSQL connection string to .env.local (see README).");
  }
  if (isProd && !isBuildPhase && (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in production.");
  }

  cached = {
    env: env.NODE_ENV,
    databaseUrl: env.DATABASE_URL ?? "",
    authSecret: new TextEncoder().encode(env.AUTH_SECRET || DEV_ONLY_SECRET),
    adminEmails: (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
    stripe: {
      secretKey: env.STRIPE_SECRET_KEY || undefined,
      webhookSecret: env.STRIPE_WEBHOOK_SECRET || undefined,
    },
    cronSecret: env.CRON_SECRET || undefined,
  };
  return cached;
}
