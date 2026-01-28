import { PrismaClient } from '@prisma/client';
import { Pool } from 'pg';
import { PrismaPg } from '@prisma/adapter-pg';

declare global {
  var prisma: PrismaClient | undefined;
}

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.warn('⚠️  DATABASE_URL is not set. Database operations will fail.');
}

let prismaInstance: PrismaClient | null = null;

try {
  if (!global.prisma) {
    // For Prisma 7, we need to use an adapter for direct database connections
    if (!databaseUrl) {
      console.error('❌ DATABASE_URL is required to initialize Prisma Client');
      console.error('   Please set DATABASE_URL in your .env file');
      prismaInstance = null;
    } else {
      // Create a PostgreSQL pool and adapter
      const pool = new Pool({ connectionString: databaseUrl });
      const adapter = new PrismaPg(pool);

      prismaInstance = new PrismaClient({
        adapter: adapter,
        log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
      });

      if (process.env.NODE_ENV !== 'production') {
        global.prisma = prismaInstance;
      }
    }
  } else {
    prismaInstance = global.prisma;
  }
} catch (error: any) {
  console.error('❌ Failed to initialize Prisma Client:', error?.message);
  if (error?.code === 'MODULE_NOT_FOUND' || error?.message?.includes('Cannot find module')) {
    console.error('   Prisma Client has not been generated.');
    console.error('   Solution: Run "npx prisma generate" in the apps/web directory');
  }
  if (error?.message?.includes('adapter') || error?.message?.includes('accelerateUrl')) {
    console.error('   Missing required adapter.');
    console.error('   Solution: Run "pnpm add @prisma/adapter-pg pg" in the apps/web directory');
  }
  // Don't throw here - let the API routes handle the error gracefully
  prismaInstance = null;
}

export const prisma = prismaInstance;
export default prisma;
