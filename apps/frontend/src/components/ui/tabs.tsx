'use client';

import { cn } from '@/lib/utils';

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
  className?: string;
}) {
  return (
    <div className={cn('flex gap-1 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-2)] p-1', className)}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          type="button"
          onClick={() => onChange(tab.id)}
          className={cn(
            'flex-1 rounded-lg px-4 py-2 text-sm font-medium transition',
            active === tab.id
              ? 'bg-[var(--color-bg-surface)] text-[var(--color-text-primary)] shadow-sm'
              : 'text-[var(--color-text-muted)] hover:text-[var(--color-text-secondary)]',
          )}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
