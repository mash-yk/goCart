/**
 * Starts Amazon's official DynamoDB Local on port 8000 for development, so you can
 * work without an AWS account. It supports everything the app uses (transactions,
 * GSIs, TTL, batch operations). Requires Java 17+ on your PATH.
 *
 *   npm run db:local          # terminal 1
 *   npm run db:setup          # terminal 2 (with DYNAMODB_ENDPOINT=http://localhost:8000)
 *
 * Data is saved in ./.dynamodb so it survives restarts. Set LOCAL_DYNAMODB_IN_MEMORY=1
 * to keep it in memory instead. Prefer Docker? Set LOCAL_DYNAMODB_DOCKER=1, or run:
 *   docker run -p 8000:8000 amazon/dynamodb-local
 */
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";
import { spawn } from "dynamo-db-local";

const port = Number(process.env.LOCAL_DYNAMODB_PORT || 8000);
const inMemory = process.env.LOCAL_DYNAMODB_IN_MEMORY === "1";
const dataDir = resolve(process.cwd(), ".dynamodb");
if (!inMemory) mkdirSync(dataDir, { recursive: true });

const child = spawn({
  port,
  path: inMemory ? null : dataDir,
  // One database for every access key and region, so the app and the setup scripts see the same tables.
  sharedDb: true,
  command: process.env.LOCAL_DYNAMODB_DOCKER === "1" ? "docker" : "java",
  stdio: "inherit",
});

console.log(`Starting DynamoDB Local on http://localhost:${port} (${inMemory ? "in-memory" : `data in ${dataDir}`}). Press Ctrl+C to stop.`);

child.on("exit", (code) => {
  if (code) console.error(`DynamoDB Local exited with code ${code}. Is Java 17+ installed? (java -version)`);
  process.exit(code ?? 0);
});
for (const signal of ["SIGINT", "SIGTERM"] as const) process.on(signal, () => child.kill(signal));
