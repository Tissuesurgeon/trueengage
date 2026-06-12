import type { Express } from 'express';
import { healthRouter } from './health.js';
import { walletRouter } from './wallet.js';
import { campaignsRouter } from './campaigns.js';
import { submissionsRouter } from './submissions.js';
import { agentsRouter } from './agents.js';
import { transactionsRouter } from './transactions.js';
import type { Env } from '../config/env.js';
import type { AgentOrchestrator } from '../services/agent-orchestrator.js';

export function registerRoutes(app: Express, orchestrator: AgentOrchestrator, env: Env) {
  app.use(healthRouter);
  app.use(walletRouter(orchestrator));
  app.use(campaignsRouter(orchestrator, env));
  app.use(submissionsRouter(orchestrator));
  app.use(agentsRouter);
  app.use(transactionsRouter);
}
