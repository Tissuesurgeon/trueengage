import { cn } from '@/lib/utils';

export function Stat({
  label,
  value,
  icon,
  className,
}: {
  label: string;
  value: string | number;
  icon?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'group rounded-2xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 transition-all duration-300 hover:border-[var(--color-brand)]/30 hover:shadow-md',
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {icon && (
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] transition-transform duration-300 group-hover:scale-105">
            {icon}
          </div>
        )}
        <div>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
          <p className="text-sm text-[var(--color-text-muted)]">{label}</p>
        </div>
      </div>
    </div>
  );
}
