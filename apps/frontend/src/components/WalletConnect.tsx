'use client';

import { Check, Copy, LogOut, Wallet } from 'lucide-react';
import { useState } from 'react';
import { useWalletContext } from '@/components/WalletProvider';
import { Avatar, shortenAddress } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dropdown, DropdownItem, DropdownLabel } from '@/components/ui/dropdown';

export function WalletConnect() {
  const { address, smartAccountAddress, status, isConnected, connect, disconnect } =
    useWalletContext();
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleConnect() {
    setLoading(true);
    try {
      await connect();
    } catch (err) {
      console.error(err);
      alert('Failed to connect wallet');
    } finally {
      setLoading(false);
    }
  }

  async function handleCopy() {
    if (!address) return;
    await navigator.clipboard.writeText(address);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  if (isConnected && address) {
    return (
      <Dropdown
        trigger={
          <button
            type="button"
            className="flex items-center gap-2 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] px-3 py-1.5 transition hover:border-[var(--color-brand)]/40"
          >
            <Avatar address={address} size="sm" />
            <span className="hidden font-mono text-sm sm:inline">
              {shortenAddress(address)}
            </span>
            <span className="h-2 w-2 rounded-full bg-[var(--color-success)]" />
          </button>
        }
      >
        <DropdownLabel>Wallet</DropdownLabel>
        <div className="px-3 py-2">
          <p className="font-mono text-sm">{shortenAddress(address, 6)}</p>
          {smartAccountAddress && smartAccountAddress !== address && (
            <p className="mt-1 text-xs text-[var(--color-text-muted)]">
              Smart account: {shortenAddress(smartAccountAddress)}
            </p>
          )}
          <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-xs text-emerald-500">
            Sepolia
          </span>
        </div>
        <DropdownItem onClick={handleCopy}>
          {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
          {copied ? 'Copied!' : 'Copy address'}
        </DropdownItem>
        <DropdownItem destructive onClick={disconnect}>
          <LogOut className="h-4 w-4" />
          Disconnect
        </DropdownItem>
      </Dropdown>
    );
  }

  return (
    <Button onClick={handleConnect} disabled={loading || status === 'connecting'} size="sm">
      <Wallet className="mr-2 h-4 w-4" />
      {loading || status === 'connecting' ? 'Connecting...' : 'Connect Wallet'}
    </Button>
  );
}
