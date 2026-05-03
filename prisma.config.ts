// Prisma config. The migrate CLI is only used locally for SQLite —
// production schema changes go through scripts/apply-migrations.mjs which
// talks to libsql directly. So this file just needs to keep `prisma migrate
// dev` happy on a local file: URL.
import "dotenv/config";
import { defineConfig } from "prisma/config";

const datasourceUrl = (() => {
  const url = process.env["DATABASE_URL"] ?? "";
  // libsql/Turso is handled at runtime via lib/prisma.ts and during deploy
  // via scripts/apply-migrations.mjs — give the migrate CLI a harmless
  // placeholder path so it doesn't reject the URL scheme.
  if (url.startsWith("libsql:") || process.env["TURSO_DATABASE_URL"]) {
    return `file:${process.cwd()}/prisma/.placeholder.db`;
  }
  return url || `file:${process.cwd()}/prisma/dev.db`;
})();

export default defineConfig({
  schema: "prisma/schema.prisma",
  datasource: { url: datasourceUrl },
  migrations: {
    path: "prisma/migrations",
  },
});
