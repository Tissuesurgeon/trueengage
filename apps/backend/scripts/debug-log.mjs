import { appendFileSync } from 'node:fs';

const LOG_PATH = '/home/richy/Desktop/.cursor/debug-15b97a.log';

export function debugLog(location, message, data, hypothesisId, runId = 'pre-fix') {
  // #region agent log
  try {
    appendFileSync(
      LOG_PATH,
      `${JSON.stringify({
        sessionId: '15b97a',
        runId,
        hypothesisId,
        location,
        message,
        data,
        timestamp: Date.now(),
      })}\n`,
    );
  } catch {
    // ignore logging failures
  }
  // #endregion
}

export function redactDatabaseUrl(url) {
  if (!url) return { present: false };
  try {
    const parsed = new URL(url);
    return {
      present: true,
      protocol: parsed.protocol,
      user: parsed.username || null,
      host: parsed.hostname,
      port: parsed.port || '5432',
      database: parsed.pathname.replace(/^\//, '') || null,
      hasSslMode: parsed.searchParams.has('sslmode'),
      sslMode: parsed.searchParams.get('sslmode'),
      hasConnectTimeout: parsed.searchParams.has('connect_timeout'),
      hasConnectionLimit: parsed.searchParams.has('connection_limit'),
      hasPoolTimeout: parsed.searchParams.has('pool_timeout'),
      paramCount: [...parsed.searchParams.keys()].length,
      startsWithPostgresql: url.startsWith('postgresql://') || url.startsWith('postgres://'),
    };
  } catch {
    return { present: true, parseError: true, startsWithPostgresql: url.startsWith('postgresql://') };
  }
}
