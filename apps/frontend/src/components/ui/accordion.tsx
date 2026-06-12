'use client';

import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils';

export function Accordion({
  items,
  className,
}: {
  items: { id: string; title: string; content: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState<string | null>(items[0]?.id ?? null);

  return (
    <div className={cn('divide-y divide-[var(--color-border)] rounded-xl border border-[var(--color-border)]', className)}>
      {items.map((item) => {
        const isOpen = open === item.id;
        return (
          <div key={item.id}>
            <button
              type="button"
              className="flex w-full items-center justify-between px-4 py-4 text-left text-sm font-medium transition hover:bg-[var(--color-bg-surface-2)]"
              onClick={() => setOpen(isOpen ? null : item.id)}
            >
              {item.title}
              <ChevronDown
                className={cn('h-4 w-4 shrink-0 transition', isOpen && 'rotate-180')}
              />
            </button>
            {isOpen && (
              <p className="border-t border-[var(--color-border)] px-4 py-3 text-sm text-[var(--color-text-secondary)]">
                {item.content}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}
