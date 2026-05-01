import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

/**
 * Build the libsql config based on what's available in the environment.
 *
 * Production (Vercel + Turso) sets `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN`.
 * Local dev falls back to a SQLite file in `prisma/dev.db`.
 *
 * Prisma 7's libsql adapter takes the libsql Config directly — no need
 * to call createClient() first.
 */
function buildAdapter() {
  const tursoUrl = process.env.TURSO_DATABASE_URL;
  const tursoToken = process.env.TURSO_AUTH_TOKEN;

  if (tursoUrl) {
    return new PrismaLibSql({
      url: tursoUrl,
      authToken: tursoToken,
    });
  }

  if (process.env.NODE_ENV === "production") {
    throw new Error(
      "Missing TURSO_DATABASE_URL in production. Set it in your hosting environment.",
    );
  }

  return new PrismaLibSql({
    url: `file:${process.cwd()}/prisma/dev.db`,
  });
}

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter: buildAdapter() });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
