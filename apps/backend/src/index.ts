import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { loadEnv } from './config/env.js';
import { loadEnvFile } from './config/loadEnvFile.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, '../../../.env'), { override: true });
loadEnvFile(resolve(__dirname, '../.env'), { override: true });
loadEnvFile(resolve(__dirname, '../.env.local'), { override: true });
import { connectDatabaseWithRetry, disconnectPrisma } from './db/client.js';
import { registerRoutes } from './routes/index.js';
import { AgentOrchestrator } from './services/agent-orchestrator.js';
import { startChainIndexer } from './services/chain-indexer.js';
import { initSocket } from './ws/socket.js';

const env = loadEnv();
const app = express();
const httpServer = createServer(app);

const corsOrigins = [env.FRONTEND_URL, 'http://localhost:3000'];
app.use(cors({ origin: corsOrigins }));
app.use(express.json({ limit: '10mb' }));

const orchestrator = new AgentOrchestrator(env);
registerRoutes(app, orchestrator, env);
app.use(errorHandler);
initSocket(httpServer, corsOrigins);
startChainIndexer(env);

async function start() {
  try {
    await connectDatabaseWithRetry();
  } catch (err) {
    console.error(
      '[db] Could not connect — check DATABASE_URL or use apps/backend/.env.local for local Postgres.',
      err instanceof Error ? err.message : err,
    );
    if (databaseTarget() === 'render (remote)') {
      console.error(
        '[db] Render tip: if TCP works but Prisma times out (P1001), open Render → Postgres → Access Control and allow your IP (or 0.0.0.0/0 for dev).',
      );
    }
    process.exit(1);
  }

  httpServer.listen(env.PORT, '0.0.0.0', () => {
    console.log(`TrueEngage backend listening on http://0.0.0.0:${env.PORT}`);
  });
}

void start();

async function shutdown(signal: string) {
  console.log(`[backend] ${signal} — closing database connections`);
  httpServer.close();
  await disconnectPrisma();
  process.exit(0);
}

process.on('SIGINT', () => void shutdown('SIGINT'));
process.on('SIGTERM', () => void shutdown('SIGTERM'));
