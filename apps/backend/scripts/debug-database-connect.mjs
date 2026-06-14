#!/usr/bin/env node
/**
 * Debug DATABASE_URL resolution and Render connectivity.
 * Usage: pnpm --filter @trueengage/backend db:debug
 */

import { spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseTarget } from './load-database-env.mjs';
import { debugLog, redactDatabaseUrl } from './debug-log.mjs';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(backendRoot, '../..');

const shellUrl = process.env.DATABASE_URL;
const resolvedUrl = process.env.DATABASE_URL;
const envFiles = {
  rootEnv: existsSync(resolve(repoRoot, '.env')),
  backendEnv: existsSync(resolve(backendRoot, '.env')),
  backendEnvLocal: existsSync(resolve(backendRoot, '.env.local')),
};

debugLog('debug-database-connect.mjs:env-files', 'env file presence', envFiles, 'H1');
debugLog(
  'debug-database-connect.mjs:resolved-url',
  'resolved DATABASE_URL after load-database-env',
  { target: databaseTarget(), url: redactDatabaseUrl(resolvedUrl) },
  'H1',
);
debugLog(
  'debug-database-connect.mjs:url-format',
  'DATABASE_URL format validation',
  {
    startsWithPostgresql:
      resolvedUrl?.startsWith('postgresql://') || resolvedUrl?.startsWith('postgres://') || false,
    hasDuplicatePrefix: resolvedUrl?.startsWith('DATABASE_URL=') || false,
    empty: !resolvedUrl,
  },
  'H4',
);

function tcpProbe(host, port, timeoutMs = 8000) {
  return new Promise((resolvePromise) => {
    const started = Date.now();
    const socket = createConnection({ host, port: Number(port), timeout: timeoutMs }, () => {
      socket.end();
      resolvePromise({ ok: true, ms: Date.now() - started });
    });
    socket.on('error', (err) => {
      resolvePromise({ ok: false, ms: Date.now() - started, error: err.message });
    });
    socket.on('timeout', () => {
      socket.destroy();
      resolvePromise({ ok: false, ms: Date.now() - started, error: 'tcp timeout' });
    });
  });
}

async function main() {
  if (!resolvedUrl) {
    debugLog('debug-database-connect.mjs:missing-url', 'DATABASE_URL missing', {}, 'H4');
    console.error('DATABASE_URL not set');
    process.exit(1);
  }

  let host = 'unknown';
  let port = '5432';
  try {
    const parsed = new URL(resolvedUrl);
    host = parsed.hostname;
    port = parsed.port || '5432';
  } catch (err) {
    debugLog(
      'debug-database-connect.mjs:parse-error',
      'failed to parse DATABASE_URL',
      { error: err instanceof Error ? err.message : String(err) },
      'H4',
    );
  }

  const tcp = await tcpProbe(host, port);
  debugLog('debug-database-connect.mjs:tcp', 'tcp probe result', { host, port, ...tcp }, 'H5');

  const bareUrl = (() => {
    try {
      const parsed = new URL(resolvedUrl);
      parsed.search = '';
      if (!parsed.searchParams.get('sslmode')) parsed.searchParams.set('sslmode', 'require');
      parsed.search = '?sslmode=require';
      return parsed.toString();
    } catch {
      return resolvedUrl.split('?')[0] + '?sslmode=require';
    }
  })();

  const bareResult = spawnSync(
    'npx',
    ['prisma', 'db', 'execute', '--url', bareUrl, '--stdin'],
    { cwd: backendRoot, input: 'SELECT 1', encoding: 'utf8', timeout: 25000 },
  );
  debugLog(
    'debug-database-connect.mjs:prisma-bare',
    'prisma execute with bare url',
    {
      exitCode: bareResult.status,
      signal: bareResult.signal,
      stderr: (bareResult.stderr || '').slice(0, 300),
      stdout: (bareResult.stdout || '').slice(0, 100),
    },
    'H2',
  );

  const poolResult = spawnSync(
    'npx',
    ['prisma', 'db', 'execute', '--url', resolvedUrl, '--stdin'],
    { cwd: backendRoot, input: 'SELECT 1', encoding: 'utf8', timeout: 25000 },
  );
  debugLog(
    'debug-database-connect.mjs:prisma-pool',
    'prisma execute with pool params url',
    {
      exitCode: poolResult.status,
      signal: poolResult.signal,
      stderr: (poolResult.stderr || '').slice(0, 300),
      stdout: (poolResult.stdout || '').slice(0, 100),
    },
    'H2',
  );

  debugLog(
    'debug-database-connect.mjs:shell-vs-file',
    'shell DATABASE_URL before load-database-env import may differ',
    {
      note: 'load-database-env runs on import; compare target and host only',
      target: databaseTarget(),
      host,
    },
    'H3',
  );

  console.log('[db:debug] Wrote logs to /home/richy/Desktop/.cursor/debug-15b97a.log');
  console.log('[db:debug] target:', databaseTarget());
  console.log('[db:debug] host:', host);
  console.log('[db:debug] tcp:', tcp.ok ? 'ok' : tcp.error);
  console.log('[db:debug] prisma bare:', bareResult.status === 0 ? 'ok' : 'fail');
  console.log('[db:debug] prisma pool:', poolResult.status === 0 ? 'ok' : 'fail');
}

main().catch((err) => {
  debugLog(
    'debug-database-connect.mjs:fatal',
    'debug script failed',
    { error: err instanceof Error ? err.message : String(err) },
    'H1',
  );
  console.error(err);
  process.exit(1);
});
