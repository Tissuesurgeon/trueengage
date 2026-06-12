import { cn } from '@/lib/utils';

function hashAddress(address: string): number {
  let hash = 0;
  for (let i = 0; i < address.length; i++) {
    hash = address.charCodeAt(i) + ((hash << 5) - hash);
  }
  return Math.abs(hash);
}

const GRADIENTS = [
  'from-indigo-500 to-violet-600',
  'from-emerald-500 to-teal-600',
  'from-amber-500 to-orange-600',
  'from-rose-500 to-pink-600',
  'from-cyan-500 to-blue-600',
  'from-fuchsia-500 to-purple-600',
];

export function Avatar({
  address,
  size = 'md',
  className,
}: {
  address: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}) {
  const gradient = GRADIENTS[hashAddress(address) % GRADIENTS.length];
  const initials = address.slice(2, 4).toUpperCase();

  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-full bg-gradient-to-br font-bold text-white',
        gradient,
        size === 'sm' && 'h-8 w-8 text-xs',
        size === 'md' && 'h-10 w-10 text-sm',
        size === 'lg' && 'h-12 w-12 text-base',
        className,
      )}
      title={address}
    >
      {initials}
    </div>
  );
}

export function shortenAddress(address: string, chars = 4) {
  return `${address.slice(0, 2 + chars)}...${address.slice(-chars)}`;
}
