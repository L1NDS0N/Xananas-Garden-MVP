import { PrismaClient } from '@prisma/client';
import { PrismaLibSQL } from '@prisma/adapter-libsql';

declare global {
  var prisma: PrismaClient | undefined;
}

function createPrismaClient() {
  // Use Turso (libSQL) adapter if TURSO_DATABASE_URL is configured
  if (process.env.TURSO_DATABASE_URL) {
    const adapter = new PrismaLibSQL({
      url: process.env.TURSO_DATABASE_URL,
      authToken: process.env.TURSO_AUTH_TOKEN,
    });
    return new PrismaClient({
      adapter,
      log: [],
    });
  }

  // Fallback: direct SQLite
  return new PrismaClient({
    log: process.env.NODE_ENV === 'production' ? [] : ['query'],
  });
}

export const prisma = global.prisma || createPrismaClient();

if (process.env.NODE_ENV !== 'production') global.prisma = prisma;
