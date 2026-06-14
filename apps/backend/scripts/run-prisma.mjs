#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { createConnection } from 'node:net';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { databaseTarget } from './load-database-env.mjs';

async function fetchPublicIp() {
  for (const url of ['https://api.ipify.org', 'https://ifconfig.me/ip', 'https://icanhazip.com']) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(4000) });
      if (!res.ok) continue;
      const ip = (await res.text()).trim();
      if (/^\d{1,3}(\.\d{1,3}){3}$/.test(ip)) return ip;
    } catch {
      // try next provider
    }
  }
  return null;
}

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-prisma.mjs <prisma-args…>');
  process.exit(1);
}

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL not set (check .env or apps/backend/.env.local)');
  process.exit(1);
}

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
console.log(`[db] Using ${databaseTarget()}`);

function tcpProbe(host, port, timeoutMs = 5000) {
  return new Promise((resolvePromise) => {
    const socket = createConnection({ host, port: Number(port), timeout: timeoutMs }, () => {
      socket.end();
      resolvePromise(true);
    });
    socket.on('error', () => resolvePromise(false));
    socket.on('timeout', () => {
      socket.destroy();
      resolvePromise(false);
    });
  });
}

let tcpReachable = null;
try {
  const parsed = new URL(process.env.DATABASE_URL);
  tcpReachable = await tcpProbe(parsed.hostname, parsed.port || '5432');
} catch {
  tcpReachable = null;
}

const result = spawnSync('npx', ['prisma', ...args], {
  cwd: backendRoot,
  stdio: 'inherit',
  env: process.env,
});

if ((result.status ?? 1) !== 0 && tcpReachable === true && databaseTarget() === 'render') {
  const publicIp = await fetchPublicIp();
  console.error(
    '\n[db] TCP to Render Postgres succeeded but Prisma could not connect (P1001).\n' +
      '    Render is blocking external Postgres handshakes (Access Control).\n' +
      '    Fix: Render dashboard → Postgres (true_m4qq) → Networking/Access Control →\n' +
      `         add rule: ${publicIp ? `${publicIp}/32` : 'YOUR_PUBLIC_IP/32'} (or 0.0.0.0/0 for dev)\n` +
      '    Then wait 30s and run: pnpm db:push\n',
  );
}

process.exit(result.status ?? 1);
