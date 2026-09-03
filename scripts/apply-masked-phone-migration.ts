import { existsSync } from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";
import * as dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const databaseUrl = process.env.SUPABASE_DB_URL ?? process.env.DATABASE_URL;
const migrationArgument =
  process.argv[2] ??
  "supabase/migrations/20260312_mask_member_numbers_and_enable_self_member_updates.sql";
const migrationPath = path.resolve(process.cwd(), migrationArgument);

if (!databaseUrl) {
  console.error("Missing SUPABASE_DB_URL or DATABASE_URL.");
  console.error(
    "Add a real Postgres connection string, then run this script again.",
  );
  process.exit(1);
}

if (!existsSync(migrationPath)) {
  console.error(`Migration file not found: ${migrationPath}`);
  process.exit(1);
}

const checkPsql = spawnSync("psql", ["--version"], { stdio: "ignore" });

if (checkPsql.status !== 0) {
  console.error("psql is not installed or not available on PATH.");
  process.exit(1);
}

const result = spawnSync(
  "psql",
  // -1 runs the whole file in one transaction. Without it psql autocommits each
  // statement, so a file that fails partway leaves the earlier statements applied.
  ["-1", "-v", "ON_ERROR_STOP=1", databaseUrl, "-f", migrationPath],
  {
    stdio: "inherit",
  },
);

if (result.status !== 0) {
  process.exit(result.status ?? 1);
}

console.log(`Migration applied successfully: ${migrationArgument}`);
