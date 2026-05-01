import { PrismaLibSql } from "@prisma/adapter-libsql";
import { PrismaClient } from "@/app/generated/prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma?: PrismaClient;
};

// Prisma 7's libsql adapter takes the libsql Config directly — no need to
// call createClient() first.
const adapter = new PrismaLibSql({
  url: `file:${process.cwd()}/prisma/dev.db`,
});

export const prisma = globalForPrisma.prisma ?? new PrismaClient({ adapter });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}
