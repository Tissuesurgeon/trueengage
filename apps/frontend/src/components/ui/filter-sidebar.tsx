'use client';

import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { Input } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export type SortKey = 'newest' | 'reward' | 'deadline';

export interface FilterState {
  category?: string;
  minReward: string;
  maxReward: string;
  sort: SortKey;
}

interface FilterSidebarProps {
  filters: FilterState;
  onChange: (filters: FilterState) => void;
  className?: string;
}

export function FilterSidebar({ filters, onChange, className }: FilterSidebarProps) {
  function update<K extends keyof FilterState>(key: K, value: FilterState[K]) {
    onChange({ ...filters, [key]: value });
  }

  return (
    <aside
      className={cn(
        'space-y-5 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-4 shadow-[var(--shadow-card)] sm:p-5',
        className,
      )}
    >
      <div>
        <h3 className="mb-3 text-sm font-semibold">Sort by</h3>
        <select
          value={filters.sort}
          onChange={(e) => update('sort', e.target.value as SortKey)}
          className="w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-2)] px-3 py-2 text-sm text-[var(--color-text-primary)] outline-none"
        >
          <option value="newest">Newest</option>
          <option value="reward">Highest reward</option>
          <option value="deadline">Ending soon</option>
        </select>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Category</h3>
        <div className="space-y-2">
          <label className="flex cursor-pointer items-center gap-2 text-sm">
            <input
              type="radio"
              name="category"
              checked={!filters.category}
              onChange={() => update('category', undefined)}
              className="accent-[var(--color-brand)]"
            />
            All categories
          </label>
          {TASK_CATEGORIES.map((c) => (
            <label key={c} className="flex cursor-pointer items-center gap-2 text-sm">
              <input
                type="radio"
                name="category"
                checked={filters.category === c}
                onChange={() => update('category', c)}
                className="accent-[var(--color-brand)]"
              />
              {TASK_CATEGORY_LABELS[c]}
            </label>
          ))}
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold">Reward (USDC)</h3>
        <div className="flex gap-2">
          <Input
            type="number"
            placeholder="Min"
            value={filters.minReward}
            onChange={(e) => update('minReward', e.target.value)}
            className="text-sm"
          />
          <Input
            type="number"
            placeholder="Max"
            value={filters.maxReward}
            onChange={(e) => update('maxReward', e.target.value)}
            className="text-sm"
          />
        </div>
      </div>
    </aside>
  );
}
