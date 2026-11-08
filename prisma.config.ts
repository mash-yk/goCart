import { config } from "dotenv";
import { defineConfig } from "prisma/config";

// The Prisma CLI runs outside Next.js, so load the same env files the app uses.
config({ path: ".env.local", quiet: true });
config({ quiet: true });

/**
 * Prisma CLI configuration (migrations, seeding, Studio).
 *
 * Migrations use DIRECT_URL when it is set. On Neon that is the direct, non-pooled
 * connection string, because schema changes shouldn't run through the connection pooler.
 * The app itself connects with DATABASE_URL (see src/lib/db/client.ts).
 */
export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL,
  },
});
