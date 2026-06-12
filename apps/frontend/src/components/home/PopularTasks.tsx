'use client';

import { useEffect, useState } from 'react';
import type { Campaign } from '@trueengage/shared';
import { MarketplaceCard } from '@/components/MarketplaceCard';
import { Scroller, ScrollerItem } from '@/components/ui/scroller';
import { CardSkeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

export function PopularTasks() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .getCampaigns()
      .then((list) => setCampaigns(list.slice(0, 8)))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <Scroller>
        {Array.from({ length: 4 }).map((_, i) => (
          <ScrollerItem key={i}>
            <CardSkeleton />
          </ScrollerItem>
        ))}
      </Scroller>
    );
  }

  if (campaigns.length === 0) return null;

  return (
    <Scroller>
      {campaigns.map((c) => (
        <ScrollerItem key={c.id}>
          <MarketplaceCard campaign={c} compact />
        </ScrollerItem>
      ))}
    </Scroller>
  );
}
