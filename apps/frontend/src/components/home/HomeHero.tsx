'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { SearchBar } from '@/components/ui/search-bar';

const POPULAR_TAGS = ['Social Media', 'Content', 'Community', 'Marketing'];

export function HomeHero() {
  const router = useRouter();
  const [search, setSearch] = useState('');

  function submit() {
    const q = search.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : '/marketplace');
  }

  return (
    <div className="mx-auto w-full max-w-2xl">
      <SearchBar
        value={search}
        onChange={setSearch}
        onSubmit={submit}
        size="lg"
        placeholder="Try: social media engagement, content creation..."
        className="border-white/20 bg-white shadow-[0_8px_30px_rgba(0,0,0,0.12)] focus-within:border-white/40 focus-within:ring-white/20"
      />
      <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
        <span className="text-sm text-white/60">Popular:</span>
        {POPULAR_TAGS.map((tag) => (
          <button
            key={tag}
            type="button"
            onClick={() =>
              router.push(`/marketplace?q=${encodeURIComponent(tag.toLowerCase())}`)
            }
            className="rounded-full border border-white/20 bg-white/10 px-3.5 py-1 text-xs font-medium text-white/90 backdrop-blur-sm transition hover:border-white/40 hover:bg-white/20"
          >
            {tag}
          </button>
        ))}
      </div>
    </div>
  );
}
