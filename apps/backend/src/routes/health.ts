import { Router, type IRouter } from 'express';
import { databaseTarget, prisma } from '../db/client.js';

export const healthRouter: IRouter = Router();

healthRouter.get('/health', (_req, res) => {
  res.json({ status: 'ok', product: 'TrueEngage' });
});

healthRouter.get('/health/db', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({ status: 'ok', database: databaseTarget() });
  } catch (err) {
    res.status(503).json({
      status: 'error',
      database: databaseTarget(),
      error: err instanceof Error ? err.message : 'Database unavailable',
    });
  }
});
