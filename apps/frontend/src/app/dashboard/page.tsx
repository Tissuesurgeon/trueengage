'use client';

import { ArrowRight, CheckCircle2, ClipboardList, Plus, Wallet } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import type { Campaign, Submission } from '@trueengage/shared';
import { TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { PageContainer, PageHeader } from '@/components/layout/PageContainer';
import { useWalletContext } from '@/components/WalletProvider';
import { shortenAddress } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CardSkeleton } from '@/components/ui/skeleton';
import { Tabs } from '@/components/ui/tabs';
import { TxLink } from '@/components/TxLink';
import { api } from '@/lib/api';
import { formatDeadline } from '@/lib/format';
import type { SubmissionTransaction } from '@/lib/submission-payment';

function statusVariant(status: string): 'default' | 'success' | 'warning' | 'brand' {
  if (status === 'paid' || status === 'active') return 'success';
  if (status === 'rejected' || status === 'closed') return 'warning';
  if (status === 'verifying' || status === 'approved') return 'brand';
  return 'default';
}

export default function DashboardPage() {
  const { address, isConnected, connect } = useWalletContext();
  const [tab, setTab] = useState('campaigns');
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<Campaign[]>([]);
  const [submissions, setSubmissions] = useState<
    Array<Submission & { transaction?: SubmissionTransaction | null }>
  >([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!address) return;
    setLoading(true);
    Promise.all([api.getMyCampaigns(address), api.getSubmissions(), api.getCampaigns()])
      .then(([c, s, all]) => {
        setCampaigns(c);
        setAllCampaigns(all);
        setSubmissions(
          s.filter(
            (sub) => sub.participantAddress.toLowerCase() === address.toLowerCase(),
          ),
        );
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  const campaignTitleById = useMemo(() => {
    const map = new Map<string, string>();
    for (const c of allCampaigns) map.set(c.id, c.title);
    for (const c of campaigns) map.set(c.id, c.title);
    return map;
  }, [allCampaigns, campaigns]);

  const orderStats = useMemo(() => {
    const pending = submissions.filter((s) => s.status === 'pending' || s.status === 'verifying').length;
    const paid = submissions.filter((s) => s.status === 'paid').length;
    return { pending, paid, total: submissions.length };
  }, [submissions]);

  if (!isConnected || !address) {
    return (
      <PageContainer width="narrow" className="py-20 text-center">
        <Wallet className="mx-auto h-12 w-12 text-[var(--color-brand)]" />
        <h1 className="mt-4 text-2xl font-bold sm:text-3xl">Your dashboard</h1>
        <p className="mt-3 text-[var(--color-text-secondary)]">
          Connect your wallet to view campaigns you created and tasks you completed.
        </p>
        <Button className="mt-6" onClick={() => connect().catch(console.error)}>
          Connect Wallet
        </Button>
      </PageContainer>
    );
  }

  return (
    <PageContainer width="wide" className="py-6 sm:py-8">
      <PageHeader
        title="Dashboard"
        description={`Connected as ${shortenAddress(address, 8)}`}
        actions={
          <Link href="/create">
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              Create Campaign
            </Button>
          </Link>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            <ClipboardList className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{campaigns.length}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">My campaigns</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-brand)]/10 text-[var(--color-brand)]">
            <ArrowRight className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none">{orderStats.total}</p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">My submissions</p>
          </div>
        </Card>
        <Card className="flex items-center gap-4 p-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-success)]/10 text-[var(--color-success)]">
            <CheckCircle2 className="h-5 w-5" />
          </div>
          <div>
            <p className="text-2xl font-bold leading-none text-[var(--color-success)]">
              {orderStats.paid}
            </p>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Paid out</p>
          </div>
        </Card>
      </div>

      <Tabs
        tabs={[
          { id: 'campaigns', label: `My Campaigns (${campaigns.length})` },
          { id: 'submissions', label: `My Submissions (${submissions.length})` },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-8 max-w-lg"
      />

      {loading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
      ) : tab === 'campaigns' ? (
        campaigns.length === 0 ? (
          <Card className="py-12 text-center">
            <p className="font-medium">No campaigns yet</p>
            <Link href="/create">
              <Button className="mt-4">Create your first task</Button>
            </Link>
          </Card>
        ) : (
          <div className="space-y-4">
            {campaigns.map((campaign) => (
              <Card
                key={campaign.id}
                className="flex flex-wrap items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <h3 className="font-semibold">{campaign.title}</h3>
                    <Badge variant={statusVariant(campaign.status)}>{campaign.status}</Badge>
                  </div>
                  <p className="mt-1 text-sm text-[var(--color-text-muted)]">
                    {TASK_CATEGORY_LABELS[campaign.category]} · {campaign.rewardUsdc} USDC/task ·{' '}
                    {formatDeadline(campaign.deadline)}
                  </p>
                  <div className="mt-3 max-w-xs">
                    <Progress
                      value={campaign.escrowBalance ?? 0}
                      max={campaign.budgetUsdc}
                      label="Escrow"
                      showValue
                      size="sm"
                    />
                  </div>
                </div>
                <Link href={`/campaigns/${campaign.id}/progress`}>
                  <Button variant="secondary" size="sm">
                    View progress
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </Link>
              </Card>
            ))}
          </div>
        )
      ) : submissions.length === 0 ? (
        <Card className="py-12 text-center">
          <p className="font-medium">No submissions yet</p>
          <Link href="/marketplace">
            <Button className="mt-4" variant="secondary">
              Browse tasks
            </Button>
          </Link>
        </Card>
      ) : (
        <div className="overflow-hidden rounded-2xl border border-[var(--color-border)]">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-[var(--color-border)] bg-[var(--color-bg-surface-2)]">
              <tr>
                <th className="px-4 py-3 font-medium">Task</th>
                <th className="hidden px-4 py-3 font-medium sm:table-cell">Submitted</th>
                <th className="px-4 py-3 font-medium">Status</th>
                <th className="hidden px-4 py-3 font-medium md:table-cell">Transaction</th>
                <th className="px-4 py-3 font-medium">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[var(--color-border)]">
              {submissions.map((sub) => (
                <tr key={sub.id} className="bg-[var(--color-bg-surface)]">
                  <td className="px-4 py-4">
                    <Link
                      href={`/campaigns/${sub.campaignId}`}
                      className="font-medium hover:text-[var(--color-brand)]"
                    >
                      {campaignTitleById.get(sub.campaignId) ?? 'Unknown task'}
                    </Link>
                    <p className="mt-0.5 font-mono text-xs text-[var(--color-text-muted)]">
                      {shortenAddress(sub.campaignId, 6)}
                    </p>
                  </td>
                  <td className="hidden px-4 py-4 text-[var(--color-text-muted)] sm:table-cell">
                    {new Date(sub.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4">
                    <Badge variant={statusVariant(sub.status)}>{sub.status}</Badge>
                  </td>
                  <td className="hidden px-4 py-4 md:table-cell">
                    {sub.status === 'paid' || sub.status === 'approved' ? (
                      <TxLink
                        txHash={sub.txHash ?? sub.transaction?.txHash}
                        transactionId={sub.transaction?.id}
                      />
                    ) : (
                      <span className="text-xs text-[var(--color-text-muted)]">—</span>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <Link href={`/campaigns/${sub.campaignId}/progress`}>
                      <Button variant="ghost" size="sm">
                        View
                      </Button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
