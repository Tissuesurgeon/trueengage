#!/usr/bin/env node
/**
 * Smoke check: paid submissions should have an on-chain tx hash when delegation payout ran.
 *
 * Usage:
 *   node scripts/verify-delegation-payout.mjs
 *   node scripts/verify-delegation-payout.mjs <submissionId>
 */

const API = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request(path) {
  const res = await fetch(`${API}${path}`);
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(`${path} failed: ${JSON.stringify(body)}`);
  return body;
}

async function main() {
  const submissionId = process.argv[2];
  console.log('Delegation payout verification\n');

  await request('/health');
  console.log('✓ Backend healthy');

  if (submissionId) {
    const submission = await request(`/submissions/${submissionId}`);
    assertPaidWithTx(submission, submissionId);
    return;
  }

  const submissions = await request('/submissions');
  const paid = submissions.filter((s) => s.status === 'paid');
  if (paid.length === 0) {
    console.log('⚠ No paid submissions yet — create a campaign, grant delegation, verify a submission');
    process.exit(0);
  }

  for (const sub of paid) {
    assertPaidWithTx(sub, sub.id);
  }

  console.log(`\n✓ Verified ${paid.length} paid submission(s) have tx hashes`);
}

function assertPaidWithTx(submission, id) {
  const txHash = submission.txHash ?? submission.transaction?.txHash;
  if (!txHash || !/^0x[a-fA-F0-9]+$/.test(txHash)) {
    throw new Error(`Submission ${id} is paid but missing txHash`);
  }
  const policy = submission.transaction ?? {};
  console.log(`✓ ${id}: paid with tx ${txHash.slice(0, 10)}…${txHash.slice(-6)}`);
  if (policy.status) console.log(`  transaction status: ${policy.status}`);
}

main().catch((err) => {
  console.error('✗', err.message);
  process.exit(1);
});
