import "server-only";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@/generated/prisma/client";
import { getConfig } from "@/lib/config";

/**
 * One Prisma client per server process. In development, Next.js reloads modules on
 * every change, so the client is kept on globalThis to avoid opening a new
 * connection pool each time.
 *
 * The client talks to PostgreSQL through the `pg` driver adapter. On Neon, use the
 * pooled connection string for DATABASE_URL so serverless functions share connections.
 */
const globalForPrisma = globalThis as unknown as { __gocartPrisma?: PrismaClient };

export function db(): PrismaClient {
  if (!globalForPrisma.__gocartPrisma) {
    const { databaseUrl, env } = getConfig();
    const adapter = new PrismaPg({
      connectionString: databaseUrl,
      // Serverless functions each hold their own pool, so keep it small in production.
      max: env === "production" ? 5 : 10,
    });
    globalForPrisma.__gocartPrisma = new PrismaClient({
      adapter,
      log: env === "development" ? ["warn", "error"] : ["error"],
    });
  }
  return globalForPrisma.__gocartPrisma;
}

