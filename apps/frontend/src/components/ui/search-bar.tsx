'use client';

import { Search } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchBar({
  value,
  onChange,
  onSubmit,
  placeholder = 'Search tasks...',
  size = 'md',
  className,
}: {
  value: string;
  onChange: (v: string) => void;
  onSubmit: () => void;
  placeholder?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  return (
    <form
      className={cn(
        'flex w-full overflow-hidden rounded-xl border border-[var(--color-border-strong)] bg-[var(--color-bg-surface)] transition focus-within:border-[var(--color-brand)] focus-within:ring-2 focus-within:ring-[var(--color-brand)]/20',
        size === 'lg' && 'rounded-2xl',
        className,
      )}
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit();
      }}
    >
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={cn(
          'min-w-0 flex-1 bg-transparent px-4 text-[var(--color-text-primary)] placeholder:text-[var(--color-text-muted)] outline-none',
          size === 'lg' && 'h-14 text-base',
          size === 'md' && 'h-11 text-sm',
          size === 'sm' && 'h-9 text-sm',
        )}
      />
      <button
        type="submit"
        aria-label="Search"
        className={cn(
          'flex shrink-0 items-center justify-center gap-2 bg-gradient-to-r from-[var(--color-brand-from)] to-[var(--color-brand-to)] font-medium text-white transition hover:opacity-90',
          size === 'lg' && 'px-7 text-base',
          size === 'md' && 'px-5 text-sm',
          size === 'sm' && 'px-3.5 text-sm',
        )}
      >
        <Search className={size === 'lg' ? 'h-5 w-5' : 'h-4 w-4'} />
        {size === 'lg' && <span>Search</span>}
      </button>
    </form>
  );
}
