import Link from 'next/link';
import { Clock, Users } from 'lucide-react';
import type { Campaign } from '@trueengage/shared';
import { TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { Avatar, shortenAddress } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Rating, deriveCampaignRating } from '@/components/ui/rating';
import { coverGradient } from '@/lib/campaign-cover';
import { formatDeadline } from '@/lib/format';

export function MarketplaceCard({
  campaign,
  compact,
}: {
  campaign: Campaign;
  compact?: boolean;
}) {
  const gradient = coverGradient(campaign.id);
  const rating = deriveCampaignRating(campaign);
  const href = `/campaigns/${campaign.id}`;

  return (
    <Link href={href} className="group block h-full">
      <Card
        interactive
        className="flex h-full flex-col gap-0 overflow-hidden p-0"
      >
        <div
          className={`relative bg-gradient-to-br ${gradient} ${compact ? 'h-28' : 'h-36'}`}
        >
          <div className="absolute inset-0 bg-black/15 transition group-hover:bg-black/10" />
          <div className="relative flex h-full flex-col justify-between p-4">
            <Badge className="w-fit bg-white/20 text-white ring-white/20 backdrop-blur-sm">
              {TASK_CATEGORY_LABELS[campaign.category]}
            </Badge>
            <p className="text-right">
              <span className="text-2xl font-bold text-white">{campaign.rewardUsdc}</span>
              <span className="ml-1 text-sm font-medium text-white/80">USDC</span>
            </p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-2.5 p-4">
          <div className="flex items-center gap-2">
            <Avatar address={campaign.creatorAddress} size="sm" />
            <span className="truncate text-xs text-[var(--color-text-muted)]">
              {shortenAddress(campaign.creatorAddress)}
            </span>
          </div>

          <h3 className="line-clamp-2 text-[15px] font-semibold leading-snug text-[var(--color-text-primary)] group-hover:text-[var(--color-brand)]">
            {campaign.title}
          </h3>

          <Rating value={rating} count={campaign.participantCount} />

          {!compact && (
            <Progress
              value={campaign.participantCount}
              max={campaign.maxParticipants}
              label="Spots filled"
              showValue
              size="sm"
            />
          )}

          <div className="mt-auto flex items-center justify-between border-t border-[var(--color-border)] pt-3 text-xs text-[var(--color-text-muted)]">
            <span className="flex items-center gap-1">
              <Users className="h-3.5 w-3.5" />
              {campaign.participantCount}/{campaign.maxParticipants}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {formatDeadline(campaign.deadline)}
            </span>
          </div>
        </div>
      </Card>
    </Link>
  );
}
