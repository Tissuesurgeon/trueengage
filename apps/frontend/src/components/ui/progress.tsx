import { cn } from '@/lib/utils';

export function Progress({
  value,
  max = 100,
  label,
  showValue,
  variant = 'brand',
  size = 'md',
  className,
}: {
  value: number;
  max?: number;
  label?: string;
  showValue?: boolean;
  variant?: 'brand' | 'success' | 'warning';
  size?: 'sm' | 'md';
  className?: string;
}) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;

  return (
    <div className={cn('w-full', className)}>
      {(label || showValue) && (
        <div className="mb-1.5 flex items-center justify-between text-xs">
          {label && <span className="text-[var(--color-text-muted)]">{label}</span>}
          {showValue && (
            <span className="font-medium text-[var(--color-text-secondary)]">
              {value}/{max}
            </span>
          )}
        </div>
      )}
      <div
        className={cn(
          'overflow-hidden rounded-full bg-[var(--color-bg-elevated)]',
          size === 'sm' ? 'h-1.5' : 'h-2.5',
        )}
      >
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500',
            variant === 'brand' && 'bg-gradient-to-r from-[var(--color-brand-from)] to-[var(--color-brand-to)]',
            variant === 'success' && 'bg-[var(--color-success)]',
            variant === 'warning' && 'bg-[var(--color-warning)]',
          )}
          style={{ width: `${pct}%` }}
        />
      </div>
    </div>
  );
}
