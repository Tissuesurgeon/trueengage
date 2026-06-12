import { Router, type IRouter } from 'express';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db/client.js';

export const agentsRouter: IRouter = Router();

agentsRouter.get('/agents/activity', asyncHandler(async (_req, res) => {
  const decisions = await prisma.agentDecision.findMany({
    orderBy: { createdAt: 'desc' },
    take: 50,
  });
  res.json(
    decisions.map((d: (typeof decisions)[number]) => ({
      id: d.id,
      role: d.role,
      input: d.input,
      output: d.output,
      timestamp: d.createdAt.toISOString(),
    })),
  );
}));
