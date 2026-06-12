'use client';

import {
  CheckCircle2,
  Circle,
  Clock,
  Coins,
  Lock,
  Shield,
  Users,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import type { Campaign } from '@trueengage/shared';
import { TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { MarketplaceCard } from '@/components/MarketplaceCard';
import { Avatar, shortenAddress } from '@/components/ui/avatar';
import { Accordion } from '@/components/ui/accordion';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Rating, deriveCampaignRating } from '@/components/ui/rating';
import { Scroller, ScrollerItem } from '@/components/ui/scroller';
import { Skeleton } from '@/components/ui/skeleton';
import { useWalletContext } from '@/components/WalletProvider';
import { coverGradient } from '@/lib/campaign-cover';
import { api } from '@/lib/api';
import { formatDeadline } from '@/lib/format';

const FAQ = [
  {
    id: '1',
    title: 'How do I get paid?',
    content:
      'Complete the task requirements, submit proof via the form, and Venice AI verifies your work. Approved submissions trigger automatic USDC payout from escrow.',
  },
  {
    id: '2',
    title: 'What proof do I need?',
    content:
      'Typically a URL to your completed work, optional screenshot, and a description explaining how you fulfilled each requirement.',
  },
  {
    id: '3',
    title: 'How long does verification take?',
    content:
      'AI verification runs when you submit. Results appear in the dashboard within seconds. Payouts follow immediately on approval.',
  },
  {
    id: '4',
    title: 'Is my reward guaranteed?',
    content:
      'Rewards are funded in escrow before the campaign goes live. Once your submission is approved, payment is released automatically.',
  },
];

export default function CampaignDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { address } = useWalletContext();
  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [related, setRelated] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCampaign(id)
      .then((c) => {
        setCampaign(c);
        return api.getCampaigns(c.category);
      })
      .then((list) => setRelated(list.filter((c) => c.id !== id).slice(0, 6)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-10">
        <Skeleton className="mb-6 h-48 w-full rounded-2xl" />
        <div className="grid gap-6 lg:grid-cols-3">
          <div className="space-y-4 lg:col-span-2">
            <Skeleton className="h-40 w-full rounded-2xl" />
            <Skeleton className="h-32 w-full rounded-2xl" />
          </div>
          <Skeleton className="h-80 w-full rounded-2xl" />
        </div>
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="mx-auto max-w-4xl px-6 py-20 text-center">
        <p className="text-xl font-medium">Task not found</p>
      </div>
    );
  }

  const escrowBalance = campaign.escrowBalance ?? 0;
  const budget = campaign.budgetUsdc ?? escrowBalance;
  const isCreator =
    !!address && address.toLowerCase() === campaign.creatorAddress.toLowerCase();
  const gradient = coverGradient(campaign.id);
  const rating = deriveCampaignRating(campaign);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6">
      <div
        className={`relative mb-8 overflow-hidden rounded-2xl bg-gradient-to-br ${gradient} px-8 py-12`}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative">
          <Badge className="mb-4 bg-white/20 text-white">{TASK_CATEGORY_LABELS[campaign.category]}</Badge>
          <h1 className="text-3xl font-bold text-white md:text-4xl">{campaign.title}</h1>
          <div className="mt-4 flex flex-wrap items-center gap-4">
            <Link
              href={`/creators/${campaign.creatorAddress}`}
              className="flex items-center gap-2 text-white/90 hover:underline"
            >
              <Avatar address={campaign.creatorAddress} size="sm" />
              <span>{shortenAddress(campaign.creatorAddress, 6)}</span>
            </Link>
            <Rating value={rating} count={campaign.participantCount} size="md" />
          </div>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="space-y-8 lg:col-span-2">
          <section>
            <h2 className="mb-4 text-xl font-semibold">About this task</h2>
            <p className="leading-relaxed text-[var(--color-text-secondary)]">
              {campaign.description}
            </p>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <CheckCircle2 className="h-5 w-5 text-[var(--color-brand)]" />
              What you need to deliver
            </h2>
            <ul className="space-y-3">
              {campaign.rules.requirements.map((r, i) => (
                <li
                  key={r}
                  className="flex items-start gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4"
                >
                  <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--color-brand)]/15 text-sm font-bold text-[var(--color-brand)]">
                    {i + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium">{r}</p>
                    <p className="mt-1 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                      <Circle className="h-3 w-3" /> Required for approval
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          </section>

          <section>
            <h2 className="mb-4 flex items-center gap-2 text-xl font-semibold">
              <Shield className="h-5 w-5 text-[var(--color-brand)]" />
              AI verification
            </h2>
            <Card variant="gradient">
              <p className="text-sm text-[var(--color-text-secondary)]">
                Venice AI checks authenticity, requirement match, quality, and spam risk before
                releasing your USDC reward.
              </p>
            </Card>
          </section>

          <section>
            <h2 className="mb-4 text-xl font-semibold">FAQ</h2>
            <Accordion items={FAQ} />
          </section>

          {related.length > 0 && (
            <section>
              <h2 className="mb-4 text-xl font-semibold">Related tasks</h2>
              <Scroller>
                {related.map((c) => (
                  <ScrollerItem key={c.id}>
                    <MarketplaceCard campaign={c} compact />
                  </ScrollerItem>
                ))}
              </Scroller>
            </section>
          )}
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <Card className="space-y-5 border-2 border-[var(--color-border)]">
            <div className="flex items-center gap-2 text-sm text-[var(--color-text-muted)]">
              <Lock className="h-4 w-4" />
              Task package
            </div>

            <div>
              <p className="text-sm text-[var(--color-text-muted)]">You will earn</p>
              <p className="text-4xl font-bold text-[var(--color-success)]">
                {campaign.rewardUsdc} <span className="text-lg">USDC</span>
              </p>
            </div>

            <Progress
              value={escrowBalance}
              max={budget}
              label="Escrow funded"
              showValue
              variant="success"
            />

            <Progress
              value={campaign.participantCount}
              max={campaign.maxParticipants}
              label="Spots filled"
              showValue
            />

            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-xl bg-[var(--color-bg-surface-2)] p-3">
                <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Users className="h-3.5 w-3.5" /> Spots
                </p>
                <p className="mt-1 font-semibold">
                  {campaign.participantCount}/{campaign.maxParticipants}
                </p>
              </div>
              <div className="rounded-xl bg-[var(--color-bg-surface-2)] p-3">
                <p className="flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
                  <Clock className="h-3.5 w-3.5" /> Deadline
                </p>
                <p className="mt-1 font-semibold">{formatDeadline(campaign.deadline)}</p>
              </div>
            </div>

            <div className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] p-3 text-sm">
              <Coins className="h-4 w-4 text-[var(--color-brand)]" />
              <span className="text-[var(--color-text-secondary)]">Paid on AI approval</span>
            </div>

            {isCreator ? (
              <Link href={`/campaigns/${campaign.id}/progress`}>
                <Button className="w-full" size="lg" variant="secondary">
                  View Progress
                </Button>
              </Link>
            ) : (
              <Link href={`/campaigns/${campaign.id}/submit`}>
                <Button className="w-full" size="lg">
                  Continue ({campaign.rewardUsdc} USDC)
                </Button>
              </Link>
            )}

            <p className="text-center text-xs text-[var(--color-text-muted)]">
              Connect wallet to submit proof
            </p>
          </Card>
        </div>
      </div>
    </div>
  );
}
