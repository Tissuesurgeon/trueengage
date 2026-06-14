import { readFileSync } from 'fs';

export function loadEnvFile(path: string, options?: { override?: boolean }): void {
  try {
    const content = readFileSync(path, 'utf8');
    for (const line of content.split('\n')) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;

      const separator = trimmed.indexOf('=');
      if (separator === -1) continue;

      const key = trimmed.slice(0, separator).trim();
      let value = trimmed.slice(separator + 1).trim();
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1);
      }

      if (options?.override || process.env[key] === undefined) {
        process.env[key] = value;
      }
    }
  } catch {
    // Optional env file — ignore if missing.
  }
}
