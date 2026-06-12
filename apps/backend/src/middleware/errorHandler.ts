import type { ErrorRequestHandler } from 'express';
import { Prisma } from '@prisma/client';

function isDatabaseError(err: unknown): boolean {
  return (
    err instanceof Prisma.PrismaClientInitializationError ||
    err instanceof Prisma.PrismaClientKnownRequestError ||
    (err instanceof Error && /Can't reach database server/i.test(err.message))
  );
}

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  console.error(err);

  if (isDatabaseError(err)) {
    return res.status(503).json({ error: 'Database unavailable. Please try again shortly.' });
  }

  const status = typeof (err as { status?: number }).status === 'number' ? (err as { status: number }).status : 500;
  const message = err instanceof Error ? err.message : 'Internal server error';
  res.status(status).json({ error: message });
};
