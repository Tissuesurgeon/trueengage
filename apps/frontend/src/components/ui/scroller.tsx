import { cn } from '@/lib/utils';

export function Scroller({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2 scrollbar-thin',
        className,
      )}
    >
      {children}
    </div>
  );
}

export function ScrollerItem({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn('w-[280px] shrink-0 snap-start sm:w-[300px]', className)}>
      {children}
    </div>
  );
}
