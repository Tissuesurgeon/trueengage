import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client';
import { loadEnvFile } from '../config/loadEnvFile.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, '../../../.env'), { override: true });
loadEnvFile(resolve(__dirname, '../.env'), { override: true });
// Local override (gitignored) — optional local Postgres or alternate DATABASE_URL
loadEnvFile(resolve(__dirname, '../.env.local'), { override: true });

const globalForPrisma = globalThis as unknown as { prisma: PrismaClient | undefined };

function isRenderHost(url: string): boolean {
  return url.includes('render.com');
}

function isRailwayHost(url: string): boolean {
  return url.includes('railway.internal') || url.includes('rlwy.net');
}

/** Tune pool for remote Postgres (Render free tier allows very few connections). */
function withPoolParams(url: string | undefined): string | undefined {
  if (!url) return url;

  let result = url;
  const add = (key: string, value: string) => {
    if (new RegExp(`[?&]${key}=`, 'i').test(result)) return;
    result += `${result.includes('?') ? '&' : '?'}${key}=${value}`;
  };

  add('connect_timeout', isRenderHost(result) ? '30' : '10');
  add('connection_limit', isRenderHost(result) ? '1' : '5');
  if (isRenderHost(result) && !/sslmode=/i.test(result)) {
    add('sslmode', 'require');
  }

  return result;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = withPoolParams(process.env.DATABASE_URL);
}

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === 'development' ? ['error', 'warn'] : ['error'],
  });

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}

export function databaseTarget(): string {
  const url = process.env.DATABASE_URL ?? '';
  if (!url) return 'not configured';
  if (isRenderHost(url)) return 'render (remote)';
  if (isRailwayHost(url)) return url.includes('railway.internal') ? 'railway (internal)' : 'railway (public)';
  if (url.includes('localhost') || url.includes('127.0.0.1')) return 'local';
  return 'remote';
}

const RETRYABLE_DB_CODES = new Set(['P1001', 'P1002', 'P2024']);

export function isRetryableDatabaseError(err: unknown): boolean {
  if (typeof err === 'object' && err !== null && 'code' in err) {
    const code = (err as { code?: string }).code;
    if (code && RETRYABLE_DB_CODES.has(code)) return true;
  }
  if (err instanceof Error) {
    return /Can't reach database server|connection pool|ECONNREFUSED|ETIMEDOUT/i.test(err.message);
  }
  return false;
}

export async function disconnectPrisma(): Promise<void> {
  await prisma.$disconnect();
}

/** Warm the pool on startup; retries help when Render wakes from sleep. */
export async function connectDatabaseWithRetry(maxAttempts = 5): Promise<void> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$connect();
      await prisma.$queryRaw`SELECT 1`;
      console.log(`[db] Connected (${databaseTarget()})`);
      return;
    } catch (err) {
      lastError = err;
      console.warn(
        `[db] Connect attempt ${attempt}/${maxAttempts} failed (${databaseTarget()}):`,
        err instanceof Error ? err.message : err,
      );
      await disconnectPrisma();
      if (attempt < maxAttempts) {
        await new Promise((r) => setTimeout(r, Math.min(2000 * attempt, 8000)));
      }
    }
  }

  throw lastError instanceof Error
    ? lastError
    : new Error('Database connection failed after retries');
}

export async function withDatabaseRetry<T>(fn: () => Promise<T>, maxAttempts = 3): Promise<T> {
  let lastError: unknown;

  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      return await fn();
    } catch (err) {
      lastError = err;
      if (!isRetryableDatabaseError(err) || attempt === maxAttempts) throw err;
      console.warn(`[db] Retrying query (${attempt}/${maxAttempts})…`);
      await disconnectPrisma();
      await connectDatabaseWithRetry(2);
    }
  }

  throw lastError;
}
