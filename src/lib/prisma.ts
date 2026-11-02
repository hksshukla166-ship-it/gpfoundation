import { PrismaClient } from "@prisma/client";

function neonCompatibleDatabaseUrl(url = process.env.DATABASE_URL || "") {
  if (!url) return url;
  try {
    const parsed = new URL(url);
    parsed.searchParams.delete("channel_binding");
    if (parsed.hostname.includes("-pooler.")) {
      parsed.searchParams.set("pgbouncer", "true");
    }
    if (!parsed.searchParams.has("connect_timeout")) {
      parsed.searchParams.set("connect_timeout", "15");
    }
    return parsed.toString();
  } catch {
    return url;
  }
}

const databaseUrl = neonCompatibleDatabaseUrl();
if (databaseUrl) {
  process.env.DATABASE_URL = databaseUrl;
  if (!process.env.DIRECT_URL) process.env.DIRECT_URL = databaseUrl;
}

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient };

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(databaseUrl ? { datasources: { db: { url: databaseUrl } } } : {}),
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
