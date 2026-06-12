'use client';

import { useEffect, useMemo, useState } from 'react';
import { useParams } from 'next/navigation';
import type { Campaign } from '@trueengage/shared';
import { TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { MarketplaceCard } from '@/components/MarketplaceCard';
import { Avatar, shortenAddress } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Rating, deriveCampaignRating } from '@/components/ui/rating';
import { Stat } from '@/components/ui/stat';
import { Tabs } from '@/components/ui/tabs';
import { CardSkeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';
import { Coins, LayoutList, Star } from 'lucide-react';

export default function CreatorProfilePage() {
  const params = useParams();
  const address = params.address as string;
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [tab, setTab] = useState('campaigns');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getMyCampaigns(address)
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [address]);

  const stats = useMemo(() => {
    const active = campaigns.filter((c) => c.status === 'active');
    const totalRewards = campaigns.reduce((s, c) => s + c.rewardUsdc * c.maxParticipants, 0);
    const avgRating =
      campaigns.length > 0
        ? campaigns.reduce((s, c) => s + deriveCampaignRating(c), 0) / campaigns.length
        : 4.5;
    const completion =
      campaigns.length > 0
        ? Math.round(
            (campaigns.reduce((s, c) => s + c.participantCount, 0) /
              campaigns.reduce((s, c) => s + c.maxParticipants, 0)) *
              100,
          )
        : 0;
    return { active: active.length, totalRewards, avgRating, completion };
  }, [campaigns]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6">
      <Card className="mb-8">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          <Avatar address={address} size="lg" className="h-20 w-20 text-xl" />
          <div className="flex-1">
            <h1 className="text-2xl font-bold">{shortenAddress(address, 8)}</h1>
            <p className="mt-1 text-sm text-[var(--color-text-muted)]">Campaign creator on TrueEngage</p>
            <div className="mt-3">
              <Rating value={stats.avgRating} count={campaigns.length} size="md" />
            </div>
            <div className="mt-3 flex flex-wrap gap-2">
              <Badge variant="brand">AI Verified Creator</Badge>
              <Badge>{campaigns.length} campaigns</Badge>
            </div>
          </div>
        </div>
      </Card>

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <Stat label="Active tasks" value={stats.active} icon={<LayoutList className="h-5 w-5" />} />
        <Stat
          label="Total reward pool"
          value={`${stats.totalRewards} USDC`}
          icon={<Coins className="h-5 w-5" />}
        />
        <Stat label="Fill rate" value={`${stats.completion}%`} icon={<Star className="h-5 w-5" />} />
      </div>

      <Tabs
        tabs={[
          { id: 'campaigns', label: 'Active campaigns' },
          { id: 'about', label: 'About' },
        ]}
        active={tab}
        onChange={setTab}
        className="mb-6 max-w-md"
      />

      {tab === 'campaigns' && (
        <>
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <Card>
              <p className="text-sm text-[var(--color-text-muted)]">
                This creator has no campaigns yet.
              </p>
            </Card>
          ) : (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {campaigns.map((c) => (
                <MarketplaceCard key={c.id} campaign={c} />
              ))}
            </div>
          )}
        </>
      )}

      {tab === 'about' && (
        <Card>
          <h2 className="text-lg font-semibold">About this creator</h2>
          <p className="mt-3 text-sm leading-relaxed text-[var(--color-text-secondary)]">
            Verified campaign creator on TrueEngage. Launches proof-based engagement tasks with
            USDC rewards held in escrow until AI verification approves participant submissions.
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {Array.from(new Set(campaigns.map((c) => c.category))).map((cat) => (
              <Badge key={cat}>{TASK_CATEGORY_LABELS[cat]}</Badge>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
