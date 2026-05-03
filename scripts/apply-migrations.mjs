#!/usr/bin/env node
/**
 * One-shot script to apply all SQL migrations to a Turso (libsql) DB
 * directly via @libsql/client. Used because Prisma 7's migrate CLI
 * doesn't respect a libsql URL when the schema provider is "sqlite".
 *
 * Usage:
 *   DATABASE_URL='libsql://...?authToken=...' node scripts/apply-migrations.mjs
 */
import { createClient } from "@libsql/client";
import { readdirSync, readFileSync } from "node:fs";
import { resolve } from "node:path";

const url = process.env.DATABASE_URL;
if (!url) {
  console.error("Missing DATABASE_URL env var.");
  process.exit(1);
}

// libsql/client accepts the combined libsql://...?authToken=... URL form
const client = createClient({ url });

const migrationsDir = resolve(process.cwd(), "prisma/migrations");
const dirs = readdirSync(migrationsDir, { withFileTypes: true })
  .filter((d) => d.isDirectory())
  .map((d) => d.name)
  .sort();

console.log(`Found ${dirs.length} migrations.\n`);

// Make sure the migration tracking table exists (Prisma's _prisma_migrations).
// We won't try to be 100% Prisma-compatible — just enough that Prisma sees
// these migrations as applied if it ever runs against this DB.
await client.execute(`
  CREATE TABLE IF NOT EXISTS _prisma_migrations (
    id TEXT PRIMARY KEY NOT NULL,
    checksum TEXT NOT NULL,
    finished_at DATETIME,
    migration_name TEXT NOT NULL,
    logs TEXT,
    rolled_back_at DATETIME,
    started_at DATETIME NOT NULL DEFAULT current_timestamp,
    applied_steps_count INTEGER NOT NULL DEFAULT 0
  )
`);

const { rows: applied } = await client.execute(
  "SELECT migration_name FROM _prisma_migrations WHERE finished_at IS NOT NULL",
);
const appliedSet = new Set(applied.map((r) => r.migration_name));

for (const dir of dirs) {
  if (appliedSet.has(dir)) {
    console.log(`✓ ${dir} (already applied — skipping)`);
    continue;
  }

  const sqlPath = resolve(migrationsDir, dir, "migration.sql");
  const sql = readFileSync(sqlPath, "utf8");

  // Split on semicolons that end statements. Naive but works for Prisma's
  // generated SQL which doesn't use semicolons inside literals. Strip
  // `-- comment` lines from each chunk so the actual SQL is what gets sent.
  const statements = sql
    .split(/;\s*\n/)
    .map((s) =>
      s
        .split("\n")
        .filter((line) => !line.trim().startsWith("--"))
        .join("\n")
        .trim(),
    )
    .filter((s) => s.length > 0);

  console.log(`→ applying ${dir} (${statements.length} statements)…`);
  for (const stmt of statements) {
    try {
      await client.execute(stmt);
    } catch (err) {
      console.error(`\n  Failed statement:\n    ${stmt.slice(0, 80)}…\n`);
      throw err;
    }
  }

  // Best-effort: record this migration as applied so Prisma understands
  await client.execute({
    sql: `INSERT INTO _prisma_migrations (id, checksum, migration_name, started_at, finished_at, applied_steps_count)
          VALUES (?, ?, ?, datetime('now'), datetime('now'), ?)`,
    args: [
      crypto.randomUUID(),
      "manual-apply",
      dir,
      statements.length,
    ],
  });

  console.log(`✓ ${dir}`);
}

console.log("\nAll migrations applied.");
client.close();
