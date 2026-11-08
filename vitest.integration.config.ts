import { defineConfig } from "vitest/config";
import path from "node:path";

/**
 * Integration tests: run the real repositories against a real PostgreSQL database.
 * Set TEST_DATABASE_URL to a throwaway database (its name must contain "test"),
 * then: npm run test:integration
 */
export default defineConfig({
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "src"),
      // `server-only` throws outside Next.js; it's safe to stub in tests.
      "server-only": path.resolve(__dirname, "tests/integration/server-only.ts"),
    },
  },
  test: {
    environment: "node",
    include: ["tests/integration/**/*.test.ts"],
    globalSetup: ["tests/integration/global-setup.ts"],
    env: { DATABASE_URL: process.env.TEST_DATABASE_URL ?? "", NODE_ENV: "test" },
    fileParallelism: false,
    testTimeout: 20_000,
    hookTimeout: 60_000,
  },
});
