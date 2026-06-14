'use client';

import { ChevronDown, LayoutDashboard, Menu, Plus, Wallet, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { Logo } from '@/components/brand/Logo';
import { WalletConnect } from '@/components/WalletConnect';
import { useWalletContext } from '@/components/WalletProvider';
import { PageContainer } from '@/components/layout/PageContainer';
import { SearchBar } from '@/components/ui/search-bar';
import { Button } from '@/components/ui/button';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { cn } from '@/lib/utils';

const NAV = [
  { href: '/marketplace', label: 'Browse Tasks' },
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/create', label: 'Create Campaign' },
];

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { isConnected, connect } = useWalletContext();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [connecting, setConnecting] = useState(false);
  const categoriesRef = useRef<HTMLDivElement>(null);
  const isLanding = pathname === '/';
  const showHeaderSearch = !isLanding;

  useEffect(() => {
    if (pathname.startsWith('/marketplace') && typeof window !== 'undefined') {
      const q = new URLSearchParams(window.location.search).get('q') ?? '';
      setSearch(q);
    }
  }, [pathname]);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (categoriesRef.current && !categoriesRef.current.contains(e.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    if (categoriesOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [categoriesOpen]);

  function goSearch() {
    const q = search.trim();
    router.push(q ? `/marketplace?q=${encodeURIComponent(q)}` : '/marketplace');
    setMobileOpen(false);
  }

  async function handleConnect() {
    setConnecting(true);
    try {
      await connect();
    } catch (e) {
      console.error(e);
      const message =
        e instanceof Error ? e.message : 'Failed to connect wallet. Check the browser console.';
      alert(message);
    } finally {
      setConnecting(false);
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b border-[var(--color-border)] bg-[var(--color-bg-surface)]/95 backdrop-blur-xl">
        <PageContainer width="wide" className="flex items-center gap-4 py-3 lg:gap-5">
          <Logo size="md" />

          {showHeaderSearch && (
            <div className="hidden max-w-md flex-1 md:block lg:max-w-lg">
              <SearchBar
                value={search}
                onChange={setSearch}
                onSubmit={goSearch}
                size="sm"
                placeholder="What task are you looking for?"
              />
            </div>
          )}

          <nav className="ml-auto hidden items-center gap-1 lg:flex">
            {NAV.map((item) => {
              const active =
                pathname === item.href || pathname.startsWith(`${item.href}/`);
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                    active
                      ? 'bg-[var(--color-brand)]/10 text-[var(--color-brand)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]',
                  )}
                >
                  {item.label}
                </Link>
              );
            })}
            <div className="relative" ref={categoriesRef}>
              <button
                type="button"
                onClick={() => setCategoriesOpen((v) => !v)}
                className="flex items-center gap-1 rounded-lg px-3 py-2 text-sm font-medium text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-text-primary)]"
              >
                Categories
                <ChevronDown
                  className={cn('h-4 w-4 transition-transform', categoriesOpen && 'rotate-180')}
                />
              </button>
              {categoriesOpen && (
                <div className="absolute right-0 top-full z-50 mt-2 min-w-[220px] rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-1.5 shadow-[var(--shadow-card-hover)]">
                  {TASK_CATEGORIES.map((c) => (
                    <Link
                      key={c}
                      href={`/marketplace?category=${c}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] hover:text-[var(--color-brand)]"
                    >
                      {TASK_CATEGORY_LABELS[c]}
                    </Link>
                  ))}
                </div>
              )}
            </div>
          </nav>

          <div className="ml-auto flex items-center gap-2 lg:ml-0">
            <ThemeToggle />
            {isConnected ? (
              <>
                <Link href="/create" className="hidden sm:block">
                  <Button variant="ghost" size="sm">
                    <Plus className="mr-1 h-4 w-4" />
                    Create
                  </Button>
                </Link>
                <Link href="/dashboard" className="hidden sm:block">
                  <Button variant="ghost" size="icon" aria-label="Dashboard">
                    <LayoutDashboard className="h-4 w-4" />
                  </Button>
                </Link>
                <WalletConnect />
              </>
            ) : (
              <Button onClick={handleConnect} disabled={connecting} size="sm">
                <Wallet className="mr-2 h-4 w-4" />
                <span className="hidden sm:inline">
                  {connecting ? 'Connecting...' : 'Connect Wallet'}
                </span>
                <span className="sm:hidden">{connecting ? '...' : 'Connect'}</span>
              </Button>
            )}
            <button
              type="button"
              className="rounded-lg p-2 text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)] lg:hidden"
              onClick={() => setMobileOpen((v) => !v)}
              aria-label="Toggle menu"
            >
              {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </PageContainer>

        {mobileOpen && (
          <nav className="border-t border-[var(--color-border)] lg:hidden">
            <PageContainer width="wide" className="py-3">
              {showHeaderSearch && (
                <div className="mb-3">
                  <SearchBar
                    value={search}
                    onChange={setSearch}
                    onSubmit={goSearch}
                    size="sm"
                  />
                </div>
              )}
              {NAV.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2.5 text-sm font-medium text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-surface-2)]"
                >
                  {item.label}
                </Link>
              ))}
              <p className="mt-2 px-3 text-xs font-semibold uppercase tracking-wider text-[var(--color-text-muted)]">
                Categories
              </p>
              {TASK_CATEGORIES.map((c) => (
                <Link
                  key={c}
                  href={`/marketplace?category=${c}`}
                  onClick={() => setMobileOpen(false)}
                  className="block rounded-lg px-3 py-2 text-sm text-[var(--color-text-secondary)]"
                >
                  {TASK_CATEGORY_LABELS[c]}
                </Link>
              ))}
            </PageContainer>
          </nav>
        )}
      </header>

      <main className="flex-1">{children}</main>

      <footer className="border-t border-[var(--color-border)] bg-[var(--color-bg-surface)]">
        <PageContainer width="wide" className="py-10 sm:py-12">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                Categories
              </h4>
              <ul className="space-y-2">
                {TASK_CATEGORIES.map((c) => (
                  <li key={c}>
                    <Link
                      href={`/marketplace?category=${c}`}
                      className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                    >
                      {TASK_CATEGORY_LABELS[c]}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                Marketplace
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/marketplace"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    Browse Tasks
                  </Link>
                </li>
                <li>
                  <Link
                    href="/create"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    Create Campaign
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dashboard"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    Dashboard
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                About
              </h4>
              <ul className="space-y-2">
                <li>
                  <Link
                    href="/#how-it-works"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    How it works
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#security"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    Security
                  </Link>
                </li>
                <li>
                  <Link
                    href="/#powered-by"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    Hackathon
                  </Link>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="mb-3 text-sm font-semibold text-[var(--color-text-primary)]">
                Community
              </h4>
              <ul className="space-y-2">
                <li>
                  <a
                    href="https://faucet.circle.com"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    USDC Faucet
                  </a>
                </li>
                <li>
                  <a
                    href="https://sepolia.etherscan.io"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-[var(--color-text-muted)] transition-colors hover:text-[var(--color-brand)]"
                  >
                    Sepolia Explorer
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-8 flex flex-col items-center justify-between gap-4 border-t border-[var(--color-border)] pt-6 sm:flex-row">
            <Logo size="sm" href={null} />
            <p className="text-center text-sm text-[var(--color-text-muted)] sm:text-left">
              © {new Date().getFullYear()} AI-verified engagement marketplace
            </p>
            <span className="rounded-full border border-[var(--color-border)] px-2.5 py-0.5 text-xs text-[var(--color-text-muted)]">
              Sepolia testnet
            </span>
          </div>
        </PageContainer>
      </footer>
    </div>
  );
}
