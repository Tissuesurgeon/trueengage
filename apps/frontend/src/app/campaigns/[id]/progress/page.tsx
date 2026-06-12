'use client';

import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  Coins,
  Users,
  XCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { Campaign, Submission, VerificationResult } from '@trueengage/shared';
import { useWalletContext } from '@/components/WalletProvider';
import { Avatar, shortenAddress } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Stat } from '@/components/ui/stat';
import { TxLink } from '@/components/TxLink';
import { api } from '@/lib/api';
import { formatDeadline } from '@/lib/format';
import { getSocket } from '@/lib/socket';
import type { SubmissionTransaction } from '@/lib/submission-payment';

type SubmissionRow = Submission & {
  verification?: VerificationResult & { approved: boolean };
  transaction?: SubmissionTransaction | null;
};

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'brand' {
  if (status === 'paid' || status === 'approved') return 'success';
  if (status === 'rejected') return 'warning';
  if (status === 'verifying') return 'brand';
  return 'default';
}

export default function CampaignProgressPage() {
  const params = useParams();
  const id = params.id as string;
  const { address } = useWalletContext();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<SubmissionRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [verifyingId, setVerifyingId] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [c, subs] = await Promise.all([
      api.getCampaign(id),
      api.getSubmissions(id),
    ]);
    setCampaign(c);
    setSubmissions(subs as SubmissionRow[]);
    setLoading(false);
  }, [id]);

  useEffect(() => {
    load().catch(console.error);
  }, [load]);

  useEffect(() => {
    const socket = getSocket();
    const refresh = () => load().catch(console.error);
    socket.on('submissionCreated', refresh);
    socket.on('verificationCompleted', refresh);
    socket.on('paymentExecuted', refresh);
    socket.on('campaignUpdated', refresh);
    return () => {
      socket.off('submissionCreated', refresh);
      socket.off('verificationCompleted', refresh);
      socket.off('paymentExecuted', refresh);
      socket.off('campaignUpdated', refresh);
    };
  }, [load]);

  const stats = useMemo(() => {
    const pending = submissions.filter((s) => s.status === 'pending' || s.status === 'verifying').length;
    const paid = submissions.filter((s) => s.status === 'paid').length;
    const rejected = submissions.filter((s) => s.status === 'rejected').length;
    const approved = submissions.filter((s) => s.status === 'approved').length;
    const filled = submissions.filter(
      (s) => s.status === 'approved' || s.status === 'paid',
    ).length;
    return { total: submissions.length, pending, paid, rejected, approved, filled };
  }, [submissions]);

  const isCreator =
    !!address &&
    !!campaign &&
    address.toLowerCase() === campaign.creatorAddress.toLowerCase();

  async function handleVerify(submissionId: string) {
    if (!address) return;
    setVerifyingId(submissionId);
    try {
      await api.verifySubmission(submissionId, address);
      await load();
    } catch (err) {
      console.error(err);
      alert('Verification failed. Only the campaign creator can run AI verification.');
    } finally {
      setVerifyingId(null);
    }
  }

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="mb-4 h-10 w-1/2" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
        <Skeleton className="mt-6 h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-xl font-medium">Campaign not found</p>
      </div>
    );
  }

  const escrow = campaign.escrowBalance ?? 0;
  const spent = stats.paid * campaign.rewardUsdc;

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 sm:py-10">
      <Link
        href={isCreator ? '/dashboard' : `/campaigns/${id}`}
        className="mb-6 inline-flex items-center gap-2 text-sm text-[var(--color-text-muted)] hover:text-[var(--color-text-primary)]"
      >
        <ArrowLeft className="h-4 w-4" />
        {isCreator ? 'Back to My Campaigns' : 'Back to Campaign'}
      </Link>

      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-3xl font-bold tracking-tight">{campaign.title}</h1>
            <Badge variant={campaign.status === 'active' ? 'success' : 'default'}>
              {campaign.status}
            </Badge>
          </div>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            {isCreator
              ? 'Campaign progress — submissions, AI verification, and payouts'
              : 'Public progress view for this campaign'}
          </p>
        </div>
        <div className="text-right text-sm text-[var(--color-text-muted)]">
          <p>{formatDeadline(campaign.deadline)}</p>
          <p className="mt-1">{campaign.rewardUsdc} USDC per task</p>
        </div>
      </div>

      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat label="Total submissions" value={stats.total} icon={<Users className="h-5 w-5" />} />
        <Stat label="Paid out" value={stats.paid} icon={<CheckCircle2 className="h-5 w-5" />} />
        <Stat label="Pending review" value={stats.pending} icon={<Clock className="h-5 w-5" />} />
        <Stat label="Rejected" value={stats.rejected} icon={<XCircle className="h-5 w-5" />} />
      </div>

      <div className="mb-8 grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Escrow & funding</h2>
          <Progress
            value={escrow}
            max={campaign.budgetUsdc}
            label="Escrow balance"
            showValue
            variant="success"
          />
          <p className="mt-2 text-sm text-[var(--color-text-muted)]">
            ~{spent} USDC paid out · {escrow} USDC remaining
          </p>
        </Card>
        <Card>
          <h2 className="mb-4 text-lg font-semibold">Participants</h2>
          <Progress
            value={stats.filled}
            max={campaign.maxParticipants}
            label="Spots filled (approved)"
            showValue
          />
          <div className="mt-4 flex items-center gap-2 text-sm text-[var(--color-text-secondary)]">
            <Coins className="h-4 w-4 text-[var(--color-brand)]" />
            {isCreator
              ? 'Rewards released on your approval via Venice AI'
              : 'Rewards released when the creator approves via Venice AI'}
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        <h2 className="text-lg font-semibold">Submissions</h2>
        {submissions.length === 0 ? (
          <Card>
            <p className="text-sm text-[var(--color-text-muted)]">
              No submissions yet. Share your campaign in the marketplace to attract participants.
            </p>
            {isCreator && (
              <Link href={`/campaigns/${id}`}>
                <Button variant="secondary" size="sm" className="mt-4">
                  View public page
                </Button>
              </Link>
            )}
          </Card>
        ) : (
          submissions.map((sub) => (
            <Card key={sub.id} className="flex flex-col gap-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                  <Avatar address={sub.participantAddress} size="sm" />
                  <div>
                    <p className="font-medium">{shortenAddress(sub.participantAddress, 6)}</p>
                    <p className="text-xs text-[var(--color-text-muted)]">
                      {new Date(sub.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  {sub.aiScore != null && (
                    <span className="text-sm text-[var(--color-text-muted)]">
                      AI score:{' '}
                      <strong className="text-[var(--color-brand)]">{sub.aiScore}%</strong>
                    </span>
                  )}
                  <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
                  {(sub.status === 'paid' || sub.status === 'approved') && (
                    <TxLink
                      txHash={sub.txHash ?? sub.transaction?.txHash}
                      transactionId={sub.transaction?.id}
                    />
                  )}
                </div>
              </div>
              {sub.aiReason && (
                <p className="text-sm text-[var(--color-text-secondary)]">{sub.aiReason}</p>
              )}
              {isCreator && sub.status === 'pending' && (
                <Button
                  size="sm"
                  className="w-fit"
                  onClick={() => handleVerify(sub.id)}
                  disabled={verifyingId === sub.id}
                >
                  {verifyingId === sub.id ? 'Verifying...' : 'Run AI Verification'}
                </Button>
              )}
            </Card>
          ))
        )}
      </div>
    </div>
  );
}
