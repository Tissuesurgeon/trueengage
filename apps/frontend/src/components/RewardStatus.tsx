import type { PaymentResult } from '@trueengage/shared';
import { CheckCircle2, Clock, Coins, XCircle } from 'lucide-react';
import { TxLink } from '@/components/TxLink';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';

export function RewardStatus({
  payment,
  transactionId,
}: {
  payment?: PaymentResult;
  transactionId?: string;
}) {
  if (!payment) {
    return (
      <Card>
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[var(--color-warning)]/15">
            <Clock className="h-5 w-5 text-[var(--color-warning)]" />
          </div>
          <div>
            <p className="font-medium">Payment pending</p>
            <p className="text-sm text-[var(--color-text-muted)]">
              Awaiting AI verification approval
            </p>
          </div>
        </div>
      </Card>
    );
  }

  return (
    <Card variant="gradient">
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Coins className="h-5 w-5 text-[var(--color-success)]" />
          Reward Status
        </h3>
        <Badge variant={payment.success ? 'success' : 'warning'}>
          {payment.success ? 'Sent' : 'Failed'}
        </Badge>
      </div>

      <div className="mt-4 flex items-center gap-3 rounded-xl bg-[var(--color-bg-surface-2)] p-4">
        {payment.success ? (
          <CheckCircle2 className="h-8 w-8 text-[var(--color-success)]" />
        ) : (
          <XCircle className="h-8 w-8 text-[var(--color-danger)]" />
        )}
        <div>
          <p className="text-2xl font-bold text-[var(--color-success)]">
            {payment.amountUsdc} USDC
          </p>
          <p className="text-sm text-[var(--color-text-muted)]">
            to {payment.recipient.slice(0, 6)}...{payment.recipient.slice(-4)}
          </p>
        </div>
      </div>

      {(payment.txHash || transactionId) && (
        <div className="mt-3 space-y-2 rounded-lg bg-[var(--color-bg-surface-2)] p-3">
          {transactionId && (
            <p className="text-xs text-[var(--color-text-muted)]">
              Transaction ID:{' '}
              <span className="font-mono text-[var(--color-text-primary)]">{transactionId}</span>
            </p>
          )}
          {payment.txHash && (
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-xs text-[var(--color-text-muted)]">On-chain hash:</span>
              <TxLink txHash={payment.txHash} />
            </div>
          )}
        </div>
      )}
      {payment.error && (
        <p className="mt-3 text-sm text-[var(--color-danger)]">{payment.error}</p>
      )}
    </Card>
  );
}
