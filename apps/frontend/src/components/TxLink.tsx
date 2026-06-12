import { ExternalLink } from 'lucide-react';
import { etherscanTxUrl, shortenTxHash } from '@/lib/etherscan';

export function TxLink({
  txHash,
  transactionId,
  className,
}: {
  txHash?: string | null;
  transactionId?: string | null;
  className?: string;
}) {
  if (!txHash && !transactionId) return null;

  const baseClass =
    className ??
    'inline-flex items-center gap-1.5 rounded-lg bg-[var(--color-bg-surface-2)] px-2.5 py-1 font-mono text-xs text-[var(--color-brand)] hover:underline';

  if (txHash) {
    return (
      <a
        href={etherscanTxUrl(txHash)}
        target="_blank"
        rel="noopener noreferrer"
        className={baseClass}
        title={txHash}
      >
        {shortenTxHash(txHash)}
        <ExternalLink className="h-3 w-3 shrink-0 opacity-70" />
      </a>
    );
  }

  return (
    <span className={baseClass} title={transactionId ?? undefined}>
      ID {transactionId}
    </span>
  );
}
