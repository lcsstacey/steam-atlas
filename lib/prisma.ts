import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Build the libsql adapter from env. Supports three shapes:
 *
 * 1. Production (Vercel + Turso): one combined env var —
 *      DATABASE_URL=libsql://your-db.turso.io?authToken=ey...
 *    Both Prisma's CLI (for migrations) and the libsql client at runtime
 *    parse the authToken from the query string.
 *
 * 2. Production (split form, also supported):
 *      TURSO_DATABASE_URL=libsql://your-db.turso.io
 *      TURSO_AUTH_TOKEN=ey...
 *
 * 3. Local dev (no env): falls back to prisma/dev.db SQLite file.
 */
function buildAdapter() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;
  if (tursoUrl) {
    return new PrismaLibSql({ url: tursoUrl, authToken: tursoToken });
  }

  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl?.startsWith("libsql:")) {
    // libsql URL with embedded ?authToken=… in the query string
    return new PrismaLibSql({ url: databaseUrl });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing DATABASE_URL (or TURSO_DATABASE_URL) in production. Set it in your hosting environment.",
    );
  }

  return new PrismaLibSql({ url: `file:${process.cwd()}/prisma/dev.db` });
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: buildAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
