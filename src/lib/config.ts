import "server-only";
import { z } from "zod";

/**
 * Server-side configuration, validated once on first use.
 * Values come from environment variables only; nothing sensitive is hard-coded.
 */
const envSchema = z.object({
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
  LUMORA_AWS_REGION: z.string().min(1).default("ap-south-1"),
  LUMORA_AWS_ACCESS_KEY_ID: z.string().optional(),
  LUMORA_AWS_SECRET_ACCESS_KEY: z.string().optional(),
  DYNAMODB_TABLE: z.string().min(1).default("lumora-store"),
  DYNAMODB_ENDPOINT: z.string().url().optional().or(z.literal("")),
  AUTH_SECRET: z.string().optional(),
  ADMIN_EMAILS: z.string().optional(),
});

export type AppConfig = {
  env: "development" | "test" | "production";
  aws: {
    region: string;
    endpoint?: string;
    credentials?: { accessKeyId: string; secretAccessKey: string };
  };
  tableName: string;
  authSecret: Uint8Array;
  adminEmails: string[];
};

let cached: AppConfig | null = null;

const DEV_ONLY_SECRET = "lumora-dev-only-secret-change-me-0123456789";

export function getConfig(): AppConfig {
  if (cached) return cached;

  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    throw new Error(`Invalid environment configuration: ${parsed.error.message}`);
  }
  const env = parsed.data;

  const isProd = env.NODE_ENV === "production";
  // `next build` runs with NODE_ENV=production, so only enforce the secret at request time.
  const isBuildPhase = process.env.NEXT_PHASE === "phase-production-build";
  if (isProd && !isBuildPhase && (!env.AUTH_SECRET || env.AUTH_SECRET.length < 32)) {
    throw new Error("AUTH_SECRET must be set to at least 32 characters in production.");
  }

  const hasStaticKeys = Boolean(env.LUMORA_AWS_ACCESS_KEY_ID && env.LUMORA_AWS_SECRET_ACCESS_KEY);

  cached = {
    env: env.NODE_ENV,
    aws: {
      region: env.LUMORA_AWS_REGION,
      endpoint: env.DYNAMODB_ENDPOINT || undefined,
      credentials: hasStaticKeys
        ? {
            accessKeyId: env.LUMORA_AWS_ACCESS_KEY_ID as string,
            secretAccessKey: env.LUMORA_AWS_SECRET_ACCESS_KEY as string,
          }
        : env.DYNAMODB_ENDPOINT
          ? // DynamoDB Local accepts any credentials.
            { accessKeyId: "local", secretAccessKey: "local" }
          : undefined,
    },
    tableName: env.DYNAMODB_TABLE,
    authSecret: new TextEncoder().encode(env.AUTH_SECRET || DEV_ONLY_SECRET),
    adminEmails: (env.ADMIN_EMAILS ?? "")
      .split(",")
      .map((e) => e.trim().toLowerCase())
      .filter(Boolean),
  };
  return cached;
}
