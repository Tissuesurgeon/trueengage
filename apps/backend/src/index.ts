import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
import cors from 'cors';
import express from 'express';
import { createServer } from 'http';
import { loadEnv } from './config/env.js';
import { loadEnvFile } from './config/loadEnvFile.js';
import { errorHandler } from './middleware/errorHandler.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
loadEnvFile(resolve(__dirname, '../../../.env'));
loadEnvFile(resolve(__dirname, '../.env'));
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

httpServer.listen(env.PORT, '0.0.0.0', () => {
  console.log(`TrueEngage backend listening on http://0.0.0.0:${env.PORT}`);
});
