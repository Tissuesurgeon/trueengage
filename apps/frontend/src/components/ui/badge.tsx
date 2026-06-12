import { cn } from '@/lib/utils';

export function Badge({
  children,
  variant = 'default',
  className,
}: {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'brand';
  className?: string;
}) {
  return (
    <span
      className={cn(
        'inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ring-1 ring-inset',
        variant === 'default' &&
          'bg-[var(--color-bg-elevated)] text-[var(--color-text-secondary)] ring-[var(--color-border)]',
        variant === 'success' &&
          'bg-emerald-500/10 text-emerald-700 ring-emerald-500/20 dark:text-emerald-400',
        variant === 'warning' &&
          'bg-amber-500/10 text-amber-700 ring-amber-500/20 dark:text-amber-400',
        variant === 'brand' &&
          'bg-indigo-500/10 text-indigo-700 ring-indigo-500/20 dark:text-indigo-300',
        className,
      )}
    >
      {children}
    </span>
  );
}
