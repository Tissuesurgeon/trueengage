'use client';

import { CheckCircle2, Circle, Link2, Image, FileText } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import type { Campaign, Submission } from '@trueengage/shared';
import { SubmissionForm, type SubmissionFormData } from '@/components/SubmissionForm';
import { useWalletContext } from '@/components/WalletProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

const PROOF_ITEMS = [
  { key: 'url', label: 'Proof URL', icon: Link2, hint: 'Link to your post, tweet, or content' },
  { key: 'screenshot', label: 'Screenshot', icon: Image, hint: 'Visual proof of completion' },
  { key: 'description', label: 'Description', icon: FileText, hint: 'Explain how you completed the task' },
] as const;

function parseApiError(err: unknown): string {
  if (err instanceof Error) {
    try {
      const parsed = JSON.parse(err.message) as { error?: string };
      if (typeof parsed.error === 'string') return parsed.error;
    } catch {
      /* not JSON */
    }
    return err.message;
  }
  return 'Failed to submit proof';
}

export default function SubmitPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;
  const { address, isConnected, connect } = useWalletContext();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingCampaign, setLoadingCampaign] = useState(true);
  const [data, setData] = useState<SubmissionFormData>({
    url: '',
    screenshotUrl: '',
    description: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    Promise.all([api.getCampaign(campaignId), api.getSubmissions(campaignId)])
      .then(([c, subs]) => {
        setCampaign(c);
        setSubmissions(subs);
      })
      .catch(console.error)
      .finally(() => setLoadingCampaign(false));
  }, [campaignId]);

  const isCreator =
    !!address &&
    !!campaign &&
    address.toLowerCase() === campaign.creatorAddress.toLowerCase();

  const walletSubmissions = useMemo(() => {
    if (!address) return [];
    return submissions
      .filter((s) => s.participantAddress.toLowerCase() === address.toLowerCase())
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }, [submissions, address]);

  const activeSubmission = walletSubmissions.find((s) => s.status !== 'rejected');
  const latestRejected = walletSubmissions[0]?.status === 'rejected' ? walletSubmissions[0] : null;
  const alreadyParticipated = !!activeSubmission;
  const canResubmitAfterRejection = !activeSubmission && !!latestRejected;

  const proofComplete = {
    url: !!data.url,
    screenshot: !!data.screenshotUrl,
    description: data.description.length >= 10,
  };

  async function handleSubmit() {
    if (!address) {
      await connect();
      return;
    }
    setLoading(true);
    setSubmitError(null);
    try {
      await api.createSubmission({
        campaignId,
        participantAddress: address,
        proof: {
          url: data.url || undefined,
          screenshotUrl: data.screenshotUrl || undefined,
          description: data.description,
        },
      });
      setSubmitted(true);
    } catch (err) {
      console.error(err);
      const message = parseApiError(err);
      setSubmitError(message);
    } finally {
      setLoading(false);
    }
  }

  if (loadingCampaign) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-10">
        <Skeleton className="mb-4 h-10 w-1/2" />
        <Skeleton className="h-64 w-full rounded-2xl" />
      </div>
    );
  }

  if (submitted) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
        <Card className="border-[var(--color-success)]/30 bg-[var(--color-success)]/5 text-center">
          <CheckCircle2 className="mx-auto h-12 w-12 text-[var(--color-success)]" />
          <h1 className="mt-4 text-2xl font-bold">Proof submitted</h1>
          <p className="mt-2 text-[var(--color-text-secondary)]">
            Your submission is pending creator review. Venice AI verification runs when the
            campaign creator approves your proof.
          </p>
          <div className="mt-6 flex flex-wrap justify-center gap-3">
            <Link href={`/campaigns/${campaignId}`}>
              <Button variant="secondary">Back to campaign</Button>
            </Link>
            <Link href="/dashboard">
              <Button>View dashboard</Button>
            </Link>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Submit Proof</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          {campaign ? `Complete "${campaign.title}"` : 'Upload your completed task for review.'}
        </p>
      </div>

      {!isConnected && (
        <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
          <p className="text-sm">Connect your wallet to submit proof and receive rewards.</p>
          <Button className="mt-3" size="sm" onClick={() => connect().catch(console.error)}>
            Connect Wallet
          </Button>
        </Card>
      )}

      {isCreator && (
        <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
          <p className="text-sm font-medium">You created this campaign</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Creators cannot submit to their own tasks. View progress from your dashboard instead.
          </p>
          <Button
            className="mt-3"
            size="sm"
            variant="secondary"
            onClick={() => router.push(`/campaigns/${campaignId}/progress`)}
          >
            View Progress
          </Button>
        </Card>
      )}

      {alreadyParticipated && activeSubmission && (
        <Card className="mb-6 border-[var(--color-brand)]/30 bg-[var(--color-brand)]/5">
          <p className="text-sm font-medium">Already participated</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            You have already submitted to this campaign. Status:{' '}
            <strong>{activeSubmission.status}</strong>. Each wallet can only participate once per
            task.
          </p>
          <Link href={`/campaigns/${campaignId}/progress`}>
            <Button className="mt-3" size="sm" variant="secondary">
              View progress
            </Button>
          </Link>
        </Card>
      )}

      {canResubmitAfterRejection && (
        <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
          <p className="text-sm font-medium">Previous attempt rejected</p>
          <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
            Your last submission was rejected. You can submit again with updated proof.
          </p>
        </Card>
      )}

      {submitError && (
        <Card className="mb-6 border-[var(--color-danger)]/30 bg-[var(--color-danger)]/5">
          <p className="text-sm text-[var(--color-danger)]">{submitError}</p>
        </Card>
      )}

      <div className="mb-6 grid gap-3 sm:grid-cols-3">
        {PROOF_ITEMS.map((item) => {
          const done = proofComplete[item.key];
          const Icon = item.icon;
          return (
            <Card
              key={item.key}
              className={done ? 'border-[var(--color-success)]/30' : ''}
            >
              <div className="flex items-center gap-2">
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-[var(--color-success)]" />
                ) : (
                  <Circle className="h-5 w-5 text-[var(--color-text-muted)]" />
                )}
                <Icon className="h-4 w-4 text-[var(--color-brand)]" />
                <span className="text-sm font-medium">{item.label}</span>
              </div>
              <p className="mt-1 text-xs text-[var(--color-text-muted)]">{item.hint}</p>
            </Card>
          );
        })}
      </div>

      {campaign && (
        <Card className="mb-6" variant="gradient">
          <h2 className="text-sm font-semibold">Task requirements</h2>
          <ul className="mt-2 space-y-1">
            {campaign.rules.requirements.map((r) => (
              <li key={r} className="flex items-start gap-2 text-sm text-[var(--color-text-secondary)]">
                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-[var(--color-brand)]" />
                {r}
              </li>
            ))}
          </ul>
        </Card>
      )}

      <Card>
        <SubmissionForm
          data={data}
          onChange={setData}
          onSubmit={handleSubmit}
          loading={loading}
          disabled={isCreator || alreadyParticipated}
        />
      </Card>
    </div>
  );
}
