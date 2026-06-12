import { cn } from '@/lib/utils';

export function Card({
  className,
  children,
  onClick,
  variant = 'default',
  interactive,
}: {
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'default' | 'gradient';
  interactive?: boolean;
}) {
  return (
    <div
      onClick={onClick}
      className={cn(
        'rounded-xl border border-[var(--color-border)] p-6 shadow-[var(--shadow-card)]',
        variant === 'default' && 'bg-[var(--color-bg-surface)]',
        variant === 'gradient' &&
          'bg-gradient-to-br from-[var(--color-bg-surface)] to-[var(--color-bg-surface-2)]',
        interactive &&
          'cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)]/30 hover:shadow-[var(--shadow-card-hover)]',
        onClick && 'cursor-pointer',
        className,
      )}
    >
      {children}
    </div>
  );
}
