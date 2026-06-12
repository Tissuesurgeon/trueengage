import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'outline' | 'success' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export function Button({
  className,
  variant = 'primary',
  size = 'md',
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-xl font-medium transition-all active:scale-[0.97] disabled:pointer-events-none disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--color-brand)]/40 focus-visible:ring-offset-2 focus-visible:ring-offset-[var(--color-bg-app)]',
        variant === 'primary' &&
          'bg-gradient-to-r from-[var(--color-brand-from)] to-[var(--color-brand-to)] text-white hover:opacity-90 shadow-sm',
        variant === 'secondary' &&
          'border border-[var(--color-border)] bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] hover:bg-[var(--color-bg-elevated)]',
        variant === 'outline' &&
          'border border-[var(--color-border-strong)] bg-transparent text-[var(--color-text-primary)] hover:bg-[var(--color-bg-surface-2)]',
        variant === 'ghost' &&
          'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]',
        variant === 'success' &&
          'bg-[var(--color-success)] text-white hover:opacity-90',
        variant === 'danger' &&
          'bg-[var(--color-danger)] text-white hover:opacity-90',
        size === 'sm' && 'px-3 py-1.5 text-sm',
        size === 'md' && 'px-4 py-2 text-sm',
        size === 'lg' && 'px-6 py-3 text-base',
        size === 'icon' && 'h-9 w-9 p-0',
        className,
      )}
      {...props}
    />
  );
}
