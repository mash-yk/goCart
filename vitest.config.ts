import { defineConfig } from "vitest/config";
import path from "node:path";

/** Unit tests: pure business logic, no database needed. */
export default defineConfig({
  resolve: {
    alias: { "@": path.resolve(__dirname, "src") },
  },
  test: {
    environment: "node",
    include: ["tests/unit/**/*.test.ts"],
  },
});
