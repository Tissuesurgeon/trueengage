#!/usr/bin/env node
/**
 * Load DATABASE_URL (and related vars) from repo/backend .env files.
 * Later files override earlier ones so apps/backend/.env.local can override for local dev.
 */

import { readFileSync, existsSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const backendRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const repoRoot = resolve(backendRoot, '../..');

function loadEnvFile(path, { override = false } = {}) {
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
    if (override || process.env[key] === undefined) {
      process.env[key] = value;
    }
  }
}

loadEnvFile(resolve(repoRoot, '.env'), { override: true });
loadEnvFile(resolve(backendRoot, '.env'), { override: true });
loadEnvFile(resolve(backendRoot, '.env.local'), { override: true });

function isRailwayHost(url) {
  return url.includes('railway.internal') || url.includes('rlwy.net');
}

function withPoolParams(url) {
  let result = url;
  const add = (key, value) => {
    if (new RegExp(`[?&]${key}=`, 'i').test(result)) return;
    result += `${result.includes('?') ? '&' : '?'}${key}=${value}`;
  };

  add('connect_timeout', result.includes('render.com') ? '30' : '10');
  add('connection_limit', result.includes('render.com') ? '1' : '5');
  if (result.includes('render.com') && !/sslmode=/i.test(result)) {
    add('sslmode', 'require');
  }
  if (isRailwayHost(result) && result.includes('rlwy.net') && !/sslmode=/i.test(result)) {
    add('sslmode', 'require');
  }

  return result;
}

if (process.env.DATABASE_URL) {
  process.env.DATABASE_URL = withPoolParams(process.env.DATABASE_URL);
}

export function databaseTarget() {
  const url = process.env.DATABASE_URL ?? '';
  if (!url) return 'not configured';
  if (url.includes('render.com')) return 'render';
  if (url.includes('railway.internal')) return 'railway (internal)';
  if (url.includes('rlwy.net')) return 'railway (public)';
  if (url.includes('localhost') || url.includes('127.0.0.1')) return 'local';
  return 'remote';
}
