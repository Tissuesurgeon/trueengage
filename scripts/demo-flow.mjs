#!/usr/bin/env node
/**
 * TrueEngage demo flow verification script.
 * Requires backend running with DATABASE_URL configured.
 *
 * Usage: node scripts/demo-flow.mjs
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request(path, options = {}) {
  const res = await fetch(`${API}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} failed: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  console.log('TrueEngage Demo Flow Verification\n');

  const health = await request('/health');
  console.log('✓ Health:', health.status);

  const creator = '0x70997970C51812dc3A010C7d01b50e0d17dc79C8';
  const participant = '0x3C44CdDdB6a900fa2b585dd299e03d12FA4293BC';

  const campaign = await request('/campaigns', {
    method: 'POST',
    body: JSON.stringify({
      creatorAddress: creator,
      title: 'Promote Web3 Launch',
      description: 'Create promotional X post for our Web3 product launch.',
      category: 'social_media',
      taskRequirements: 'Mention @TrueEngage\nInclude #Web3Launch\nMinimum 50 words\nPositive sentiment',
      rewardUsdc: 2,
      budgetUsdc: 100,
      maxParticipants: 20,
      deadline: new Date(Date.now() + 7 * 86400000).toISOString(),
    }),
  });
  console.log('✓ Campaign created:', campaign.id);

  const deposited = await request(`/campaigns/${campaign.id}/deposit`, {
    method: 'POST',
    body: JSON.stringify({ amountUsdc: 100 }),
  });
  console.log('✓ Escrow deposited:', deposited.escrowBalance, 'USDC');

  const submission = await request('/submissions', {
    method: 'POST',
    body: JSON.stringify({
      campaignId: campaign.id,
      participantAddress: participant,
      proof: {
        url: 'https://x.com/demo/post/123',
        description:
          'Excited to share @TrueEngage and the amazing #Web3Launch! This project is revolutionizing creator engagement with AI verification and autonomous USDC rewards on Sepolia. Join the future of verified creator campaigns today with programmable smart wallets.',
      },
    }),
  });
  console.log('✓ Submission created:', submission.id);

  const verified = await request(`/submissions/${submission.id}/verify`, { method: 'POST' });
  console.log('✓ AI Verification:', verified.verification.approved ? 'APPROVED' : 'REJECTED');
  console.log('  Score:', verified.verification.score);
  console.log('  Reason:', verified.verification.reason);

  if (verified.payment) {
    console.log('✓ Payment:', verified.payment.success ? 'SUCCESS' : 'FAILED');
    if (verified.payment.txHash) console.log('  TxHash:', verified.payment.txHash);
  }

  const agents = await request('/agents/activity');
  console.log('✓ Agent decisions logged:', agents.length);

  console.log('\nDemo flow complete!');
}

main().catch((err) => {
  console.error('\nDemo flow failed:', err.message);
  console.error('Ensure PostgreSQL is running and backend is started: pnpm --filter @trueengage/backend dev');
  process.exit(1);
});
