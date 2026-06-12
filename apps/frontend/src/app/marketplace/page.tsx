'use client';

import { Suspense } from 'react';
import { SlidersHorizontal, X } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import type { Campaign } from '@trueengage/shared';
import { TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { MarketplaceCard } from '@/components/MarketplaceCard';
import { PageContainer } from '@/components/layout/PageContainer';
import {
  FilterSidebar,
  type FilterState,
  type SortKey,
} from '@/components/ui/filter-sidebar';
import { SearchBar } from '@/components/ui/search-bar';
import { CardSkeleton } from '@/components/ui/skeleton';
import { api } from '@/lib/api';

function MarketplaceContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialQ = searchParams.get('q') ?? '';
  const initialCategory = searchParams.get('category') ?? undefined;

  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [search, setSearch] = useState(initialQ);
  const [filters, setFilters] = useState<FilterState>({
    category: initialCategory,
    minReward: '',
    maxReward: '',
    sort: 'newest',
  });
  const [loading, setLoading] = useState(true);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  useEffect(() => {
    setSearch(initialQ);
  }, [initialQ]);

  useEffect(() => {
    setFilters((f) => ({ ...f, category: initialCategory }));
  }, [initialCategory]);

  useEffect(() => {
    setLoading(true);
    api
      .getCampaigns(filters.category)
      .then(setCampaigns)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [filters.category]);

  function submitSearch() {
    const q = search.trim();
    const params = new URLSearchParams();
    if (q) params.set('q', q);
    if (filters.category) params.set('category', filters.category);
    const qs = params.toString();
    router.push(qs ? `/marketplace?${qs}` : '/marketplace');
  }

  const filtered = useMemo(() => {
    let list = campaigns.filter((c) => {
      const q = search.toLowerCase();
      const matchesSearch =
        !q ||
        c.title.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q);
      const min = filters.minReward ? parseFloat(filters.minReward) : 0;
      const max = filters.maxReward ? parseFloat(filters.maxReward) : Infinity;
      const matchesReward = c.rewardUsdc >= min && c.rewardUsdc <= max;
      return matchesSearch && matchesReward;
    });

    if (filters.sort === 'reward') {
      list = [...list].sort((a, b) => b.rewardUsdc - a.rewardUsdc);
    } else if (filters.sort === 'deadline') {
      list = [...list].sort(
        (a, b) => new Date(a.deadline).getTime() - new Date(b.deadline).getTime(),
      );
    } else {
      list = [...list].sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
    }

    return list;
  }, [campaigns, search, filters]);

  const activeChips: { label: string; clear: () => void }[] = [];
  if (search) activeChips.push({ label: `"${search}"`, clear: () => setSearch('') });
  if (filters.category)
    activeChips.push({
      label: TASK_CATEGORY_LABELS[filters.category as keyof typeof TASK_CATEGORY_LABELS],
      clear: () => setFilters((f) => ({ ...f, category: undefined })),
    });
  if (filters.minReward || filters.maxReward)
    activeChips.push({
      label: `Reward ${filters.minReward || '0'}-${filters.maxReward || '∞'} USDC`,
      clear: () => setFilters((f) => ({ ...f, minReward: '', maxReward: '' })),
    });

  return (
    <PageContainer width="wide" className="py-6 sm:py-8">
      <div className="mb-6">
        <p className="text-sm text-[var(--color-text-muted)]">
          <span className="text-[var(--color-text-secondary)]">Home</span>
          <span className="mx-2">/</span>
          Browse tasks
        </p>
        <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {search ? `Results for "${search}"` : 'Browse tasks'}
            </h1>
            <p className="mt-1 text-sm text-[var(--color-text-secondary)]">
              {loading
                ? 'Loading...'
                : `${filtered.length} task${filtered.length !== 1 ? 's' : ''} available`}
            </p>
          </div>
          <div className="flex items-center gap-2 lg:hidden">
            <select
              value={filters.sort}
              onChange={(e) =>
                setFilters((f) => ({ ...f, sort: e.target.value as SortKey }))
              }
              className="h-9 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm outline-none"
            >
              <option value="newest">Newest</option>
              <option value="reward">Highest reward</option>
              <option value="deadline">Ending soon</option>
            </select>
            <button
              type="button"
              onClick={() => setMobileFiltersOpen((v) => !v)}
              className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 text-sm font-medium"
            >
              <SlidersHorizontal className="h-4 w-4" />
              Filters
            </button>
          </div>
        </div>

        {activeChips.length > 0 && (
          <div className="mt-4 flex flex-wrap gap-2">
            {activeChips.map((chip) => (
              <button
                key={chip.label}
                type="button"
                onClick={chip.clear}
                className="inline-flex items-center gap-1 rounded-full bg-[var(--color-brand)]/10 px-3 py-1 text-xs font-medium text-[var(--color-brand)]"
              >
                {chip.label}
                <X className="h-3 w-3" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr] lg:gap-8">
        <FilterSidebar
          filters={filters}
          onChange={setFilters}
          className={`h-fit lg:sticky lg:top-24 ${mobileFiltersOpen ? 'block' : 'hidden lg:block'}`}
        />

        <div>
          <div className="mb-5 md:hidden">
            <SearchBar
              value={search}
              onChange={setSearch}
              onSubmit={submitSearch}
              size="md"
              placeholder="Search tasks..."
            />
          </div>

          {loading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 6 }).map((_, i) => (
                <CardSkeleton key={i} />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="rounded-xl border border-dashed border-[var(--color-border)] bg-[var(--color-bg-surface)] py-16 text-center">
              <p className="text-lg font-medium">No tasks match your filters</p>
              <p className="mt-2 text-sm text-[var(--color-text-muted)]">
                Try adjusting categories or reward range.
              </p>
            </div>
          ) : (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((campaign) => (
                <MarketplaceCard key={campaign.id} campaign={campaign} />
              ))}
            </div>
          )}
        </div>
      </div>
    </PageContainer>
  );
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <PageContainer width="wide" className="py-8">
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <CardSkeleton key={i} />
            ))}
          </div>
        </PageContainer>
      }
    >
      <MarketplaceContent />
    </Suspense>
  );
}
