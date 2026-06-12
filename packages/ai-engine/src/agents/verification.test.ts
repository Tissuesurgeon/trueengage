import { afterEach, describe, expect, it, vi } from 'vitest';
import * as fetchModule from '../fetchProofContent.js';
import { verifySubmission } from './verification.js';

describe('verifySubmission', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('uses heuristic fallback when no API key', async () => {
    vi.spyOn(fetchModule, 'fetchProofContent').mockResolvedValue({
      proofUrl: {
        url: 'https://x.com/demo',
        reachable: true,
        httpStatus: 200,
        pageTitle: 'Demo post',
        metaDescription: '@TrueEngage #Web3Launch on Sepolia',
        extractedText:
          'Love @TrueEngage and #Web3Launch amazing project creator campaigns autonomous USDC rewards Sepolia testnet',
      },
    });
    const { result, proofFetch } = await verifySubmission(
      {},
      {
        requirements: ['Mention @TrueEngage', 'Include #Web3Launch'],
        requiredMention: '@TrueEngage',
        requiredHashtag: '#Web3Launch',
        minWordCount: 50,
        proofTypes: ['url', 'description'],
      },
      'Test Campaign',
      {
        url: 'https://x.com/demo',
        description:
          'Love @TrueEngage and #Web3Launch! This is an amazing project bringing AI verification to creator campaigns with autonomous USDC rewards on Sepolia testnet.',
      },
    );

    expect(proofFetch.proofUrl).toBeDefined();
    expect(result.score).toBeGreaterThan(0);
    expect(result.reason).toBeTruthy();
    expect(['low', 'medium', 'high']).toContain(result.quality);
  });
});
