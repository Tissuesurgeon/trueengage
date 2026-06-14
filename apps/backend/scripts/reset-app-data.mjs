#!/usr/bin/env node
/**
 * Wipe all TrueEngage app data (campaigns, submissions, delegations, wallets).
 *
 * Usage: pnpm --filter @trueengage/backend db:reset
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PrismaClient } from '@prisma/client';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(backendRoot, '../..');

function loadEnvFile(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

function loadEnvFileOverride(path) {
  if (!existsSync(path)) return;
  for (const line of readFileSync(path, 'utf8').split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eq = trimmed.indexOf('=');
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    process.env[key] = value;
  }
}

loadEnvFile(resolve(repoRoot, '.env'));
loadEnvFile(resolve(backendRoot, '.env'));
loadEnvFileOverride(resolve(backendRoot, '.env.local'));

if (!process.env.DATABASE_URL) {
  console.error('✗ DATABASE_URL not set');
  process.exit(1);
}

function withPoolParams(url) {
  let result = url;
  const add = (key, value) => {
    if (new RegExp(`[?&]${key}=`, 'i').test(result)) return;
    result += `${result.includes('?') ? '&' : '?'}${key}=${value}`;
  };
  const isRailway = result.includes('railway.internal') || result.includes('rlwy.net');
  if (result.includes('render.com') && !/sslmode=/i.test(result)) {
    add('sslmode', 'require');
  }
  if (isRailway && result.includes('rlwy.net') && !/sslmode=/i.test(result)) {
    add('sslmode', 'require');
  }
  add('connect_timeout', '30');
  add('pool_timeout', '30');
  add('connection_limit', result.includes('render.com') ? '1' : '5');
  return result;
}

process.env.DATABASE_URL = withPoolParams(process.env.DATABASE_URL);

const prisma = new PrismaClient();

async function main() {
  console.log('Resetting TrueEngage database…\n');

  const before = {
    campaigns: await prisma.campaign.count(),
    submissions: await prisma.submission.count(),
    delegations: await prisma.delegation.count(),
    wallets: await prisma.wallet.count(),
    users: await prisma.user.count(),
  };

  console.log('Before:', before);

  await prisma.$transaction([
    prisma.transaction.deleteMany(),
    prisma.verification.deleteMany(),
    prisma.submission.deleteMany(),
    prisma.agentDecision.deleteMany(),
    prisma.campaign.deleteMany(),
    prisma.delegation.deleteMany(),
    prisma.wallet.deleteMany(),
    prisma.user.deleteMany(),
  ]);

  const after = {
    campaigns: await prisma.campaign.count(),
    submissions: await prisma.submission.count(),
    delegations: await prisma.delegation.count(),
    wallets: await prisma.wallet.count(),
    users: await prisma.user.count(),
  };

  console.log('After:', after);
  console.log('\n✓ Database cleared.');
  console.log('  Browser: disconnect wallet → clear localStorage "trueengage_wallet" → reconnect.');
  console.log('  Then create a new campaign end-to-end (fund SA → grant signedDelegation).');
}

main()
  .catch((err) => {
    console.error('✗ Reset failed:', err.message);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
