import { describe, expect, it } from 'vitest';
import {
  combinedPageText,
  descriptionPageOverlap,
  extractTextFromHtml,
  isUrlSafe,
} from './fetchProofContent.js';

describe('isUrlSafe', () => {
  it('allows public https URLs', () => {
    expect(isUrlSafe('https://x.com/user/status/123')).toBe(true);
  });

  it('blocks localhost and private IPs', () => {
    expect(isUrlSafe('http://localhost/post')).toBe(false);
    expect(isUrlSafe('http://127.0.0.1/')).toBe(false);
    expect(isUrlSafe('http://192.168.1.1/')).toBe(false);
    expect(isUrlSafe('file:///etc/passwd')).toBe(false);
  });
});

describe('extractTextFromHtml', () => {
  it('extracts og tags and visible text', () => {
    const html = `
      <html><head>
        <meta property="og:title" content="My Post Title" />
        <meta property="og:description" content="Check out @TrueEngage #Web3Launch" />
        <title>Fallback Title</title>
      </head><body>
        <script>ignore()</script>
        <p>Hello from the post body</p>
      </body></html>
    `;
    const out = extractTextFromHtml(html);
    expect(out.pageTitle).toBe('My Post Title');
    expect(out.metaDescription).toContain('@TrueEngage');
    expect(out.extractedText).toContain('Hello from the post body');
    expect(out.extractedText).not.toContain('ignore');
  });
});

describe('descriptionPageOverlap', () => {
  it('scores higher when description words appear on page', () => {
    const page = 'trueengage web3launch amazing project sepolia rewards';
    const good = 'Love @TrueEngage and #Web3Launch on Sepolia with amazing rewards';
    const bad = 'Totally unrelated content about cats and dogs only';
    expect(descriptionPageOverlap(good, page)).toBeGreaterThan(0.2);
    expect(descriptionPageOverlap(bad, page)).toBeLessThan(0.15);
  });
});

describe('combinedPageText', () => {
  it('merges title, meta, and body text', () => {
    const text = combinedPageText({
      proofUrl: {
        url: 'https://example.com',
        reachable: true,
        pageTitle: 'Title',
        metaDescription: 'Meta',
        extractedText: 'Body',
      },
    });
    expect(text).toContain('title');
    expect(text).toContain('meta');
    expect(text).toContain('body');
  });
});
