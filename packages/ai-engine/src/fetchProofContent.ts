import type { SubmissionProof } from '@trueengage/shared';

export interface ProofUrlFetch {
  url: string;
  reachable: boolean;
  httpStatus?: number;
  pageTitle?: string;
  metaDescription?: string;
  extractedText?: string;
  fetchError?: string;
}

export interface ProofScreenshotFetch {
  url: string;
  reachable: boolean;
  httpStatus?: number;
  contentType?: string;
  fetchError?: string;
}

export interface ProofFetchResult {
  proofUrl?: ProofUrlFetch;
  screenshot?: ProofScreenshotFetch;
}

const FETCH_TIMEOUT_MS = 12_000;
const MAX_EXTRACTED_CHARS = 6_000;
const MAX_HTML_BYTES = 512_000;

const BLOCKED_HOSTNAMES = new Set([
  'localhost',
  '127.0.0.1',
  '0.0.0.0',
  '[::1]',
  '::1',
]);

function isPrivateIpv4(hostname: string): boolean {
  const parts = hostname.split('.').map(Number);
  if (parts.length !== 4 || parts.some((p) => Number.isNaN(p))) return false;
  const [a, b] = parts;
  if (a === 10) return true;
  if (a === 127) return true;
  if (a === 0) return true;
  if (a === 169 && b === 254) return true;
  if (a === 172 && b >= 16 && b <= 31) return true;
  if (a === 192 && b === 168) return true;
  return false;
}

export function isUrlSafe(rawUrl: string): boolean {
  try {
    const parsed = new URL(rawUrl);
    if (!['http:', 'https:'].includes(parsed.protocol)) return false;
    const host = parsed.hostname.toLowerCase();
    if (BLOCKED_HOSTNAMES.has(host)) return false;
    if (host.endsWith('.local') || host.endsWith('.internal')) return false;
    if (isPrivateIpv4(host)) return false;
    return true;
  } catch {
    return false;
  }
}

export function extractTextFromHtml(html: string): {
  pageTitle?: string;
  metaDescription?: string;
  extractedText: string;
} {
  const ogTitle = html.match(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const ogDesc = html.match(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const metaDesc = html.match(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']+)["']/i,
  )?.[1];
  const titleTag = html.match(/<title[^>]*>([^<]*)<\/title>/i)?.[1];

  const stripped = html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<noscript[\s\S]*?<\/noscript>/gi, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/\s+/g, ' ')
    .trim();

  const extractedText = stripped.slice(0, MAX_EXTRACTED_CHARS);

  return {
    pageTitle: decodeHtmlEntities(ogTitle ?? titleTag)?.trim(),
    metaDescription: decodeHtmlEntities(ogDesc ?? metaDesc)?.trim(),
    extractedText,
  };
}

function decodeHtmlEntities(text?: string): string | undefined {
  if (!text) return undefined;
  return text
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'");
}

async function fetchUrlContent(url: string): Promise<ProofUrlFetch> {
  const result: ProofUrlFetch = { url, reachable: false };

  if (!isUrlSafe(url)) {
    result.fetchError = 'URL blocked for security (private or disallowed host)';
    return result;
  }

  try {
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'User-Agent':
          'TrueEngage-Verifier/1.0 (proof-validation; +https://trueengage.local)',
        Accept: 'text/html,application/xhtml+xml',
      },
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });

    result.httpStatus = response.status;
    result.reachable = response.ok;

    if (!response.ok) {
      result.fetchError = `HTTP ${response.status}`;
      return result;
    }

    const contentType = response.headers.get('content-type') ?? '';
    if (!contentType.includes('text/html') && !contentType.includes('application/xhtml')) {
      result.fetchError = `Unexpected content type: ${contentType}`;
      return result;
    }

    const raw = await response.text();
    const html = raw.slice(0, MAX_HTML_BYTES);
    const extracted = extractTextFromHtml(html);
    result.pageTitle = extracted.pageTitle;
    result.metaDescription = extracted.metaDescription;
    result.extractedText = extracted.extractedText;
  } catch (err) {
    result.fetchError = err instanceof Error ? err.message : 'Fetch failed';
  }

  return result;
}

async function fetchScreenshot(url: string): Promise<ProofScreenshotFetch> {
  const result: ProofScreenshotFetch = { url, reachable: false };

  if (!isUrlSafe(url)) {
    result.fetchError = 'URL blocked for security';
    return result;
  }

  try {
    const response = await fetch(url, {
      method: 'HEAD',
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
      redirect: 'follow',
    });

    result.httpStatus = response.status;
    result.contentType = response.headers.get('content-type') ?? undefined;
    result.reachable =
      response.ok && (result.contentType?.startsWith('image/') ?? false);

    if (!result.reachable && response.ok) {
      result.fetchError = `Not an image: ${result.contentType ?? 'unknown'}`;
    } else if (!response.ok) {
      result.fetchError = `HTTP ${response.status}`;
    }
  } catch (err) {
    result.fetchError = err instanceof Error ? err.message : 'Fetch failed';
  }

  return result;
}

/** Pre-fetch proof URL HTML and verify screenshot URL before AI verification. */
export async function fetchProofContent(submission: SubmissionProof): Promise<ProofFetchResult> {
  const result: ProofFetchResult = {};

  if (submission.url) {
    result.proofUrl = await fetchUrlContent(submission.url);
  }

  if (submission.screenshotUrl) {
    result.screenshot = await fetchScreenshot(submission.screenshotUrl);
  }

  return result;
}

/** Combined text from fetched page for rule matching. */
export function combinedPageText(fetch: ProofFetchResult): string {
  const parts: string[] = [];
  const url = fetch.proofUrl;
  if (url?.pageTitle) parts.push(url.pageTitle);
  if (url?.metaDescription) parts.push(url.metaDescription);
  if (url?.extractedText) parts.push(url.extractedText);
  return parts.join(' ').toLowerCase();
}

/** Rough overlap between participant description and fetched page text (0–1). */
export function descriptionPageOverlap(description: string, pageText: string): number {
  const descWords = new Set(
    description
      .toLowerCase()
      .split(/\W+/)
      .filter((w) => w.length > 3),
  );
  if (descWords.size === 0) return 0;

  const pageWords = new Set(pageText.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  let overlap = 0;
  for (const w of descWords) {
    if (pageWords.has(w)) overlap++;
  }
  return overlap / descWords.size;
}
