'use client';

import { Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

interface WalletPermissionModalProps {
  open: boolean;
  budgetUsdc: number;
  onGrant: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function WalletPermissionModal({
  open,
  budgetUsdc,
  onGrant,
  onClose,
  loading,
}: WalletPermissionModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <Card className="max-w-md">
        <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-[var(--color-brand)]/15">
          <Shield className="h-6 w-6 text-[var(--color-brand)]" />
        </div>
        <h3 className="text-lg font-semibold">Grant Payment Permission</h3>
        <p className="mt-2 text-sm text-[var(--color-text-secondary)]">
          Sign a MetaMask Hybrid smart account delegation (ERC-7710) so the TrueEngage payment
          agent can redeem USDC from your smart account to verified participants — per the{' '}
          <a
            href="https://docs.metamask.io/smart-accounts-kit/guides/delegation/execute-on-smart-accounts-behalf/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-[var(--color-brand)] underline"
          >
            Smart Accounts Kit delegation flow
          </a>
          .
        </p>
        <ul className="mt-4 space-y-2 rounded-xl bg-[var(--color-bg-surface-2)] p-4 text-sm text-[var(--color-text-secondary)]">
          <li>Allowed token: USDC only</li>
          <li>Maximum budget: {budgetUsdc} USDC</li>
          <li>Expiration: 7 days</li>
          <li>Redeemer: 1Shot relayer only</li>
        </ul>
        <div className="mt-6 flex gap-3">
          <Button variant="secondary" onClick={onClose} className="flex-1">
            Cancel
          </Button>
          <Button onClick={onGrant} disabled={loading} className="flex-1">
            {loading ? 'Granting...' : 'Grant Permission'}
          </Button>
        </div>
      </Card>
    </div>
  );
}
