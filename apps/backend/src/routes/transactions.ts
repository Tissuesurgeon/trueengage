import { Router, type IRouter } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db/client.js';

export const transactionsRouter: IRouter = Router();

transactionsRouter.get('/transactions', asyncHandler(async (_req, res) => {
  const transactions = await prisma.transaction.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
    include: { submission: { include: { campaign: true } } },
  });
  res.json(transactions);
}));
