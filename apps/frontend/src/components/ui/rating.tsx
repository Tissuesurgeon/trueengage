import { Star } from 'lucide-react';
import { cn } from '@/lib/utils';

export function Rating({
  value,
  max = 5,
  count,
  size = 'sm',
  className,
}: {
  value: number;
  max?: number;
  count?: number;
  size?: 'sm' | 'md';
  className?: string;
}) {
  const filled = Math.round((value / max) * 5 * 10) / 10;
  const stars = 5;

  return (
    <div className={cn('flex items-center gap-1.5', className)}>
      <div className="flex">
        {Array.from({ length: stars }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              size === 'md' ? 'h-4 w-4' : 'h-3.5 w-3.5',
              i < Math.floor(filled)
                ? 'fill-[var(--color-text-primary)] text-[var(--color-text-primary)]'
                : 'text-[var(--color-border-strong)]',
            )}
          />
        ))}
      </div>
      <span className={cn('font-bold', size === 'md' ? 'text-sm' : 'text-xs')}>
        {filled.toFixed(1)}
      </span>
      {count != null && (
        <span className="text-xs text-[var(--color-text-muted)]">({count})</span>
      )}
    </div>
  );
}

/** Derive a display rating from campaign stats (placeholder until real reviews exist) */
export function deriveCampaignRating(campaign: {
  participantCount: number;
  maxParticipants: number;
}): number {
  const fill = campaign.maxParticipants > 0
    ? campaign.participantCount / campaign.maxParticipants
    : 0;
  return 4.2 + fill * 0.8;
}
