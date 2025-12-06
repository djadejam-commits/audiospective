import { PrismaClient } from '@prisma/client';
import { env } from '@/config/env'; // Validates env vars at import time

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

// Configure Prisma with optimized connection pool settings for Neon
export const prisma = globalForPrisma.prisma ?? new PrismaClient({
  datasources: {
    db: {
      url: env.DATABASE_URL,
    },
  },
  log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
});

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

// Graceful shutdown - ensure connections are closed properly
if (typeof window === 'undefined') {
  const cleanup = async () => {
    await prisma.$disconnect();
  };

  process.on('beforeExit', cleanup);
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
}
