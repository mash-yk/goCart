import { readdirSync, readFileSync } from "node:fs";
import path from "node:path";
import { Client } from "pg";

/**
 * Rebuilds the test database from scratch by running every migration in
 * prisma/migrations in order, exactly the SQL that `prisma migrate deploy` runs.
 */
export default async function setup() {
  const url = process.env.TEST_DATABASE_URL;
  if (!url) throw new Error("Set TEST_DATABASE_URL to run the integration tests.");
  if (!/test/i.test(new URL(url).pathname)) {
    throw new Error("Refusing to reset a database whose name doesn't contain 'test'.");
  }

  const dir = path.resolve(__dirname, "../../prisma/migrations");
  const migrations = readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory())
    .map((d) => d.name)
    .sort();

  const client = new Client({ connectionString: url });
  await client.connect();
  try {
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');
    for (const name of migrations) {
      await client.query(readFileSync(path.join(dir, name, "migration.sql"), "utf8"));
    }
  } finally {
    await client.end();
  }
}
