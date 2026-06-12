import { cn } from '@/lib/utils';

type PageWidth = 'narrow' | 'default' | 'wide';

const widthClass: Record<PageWidth, string> = {
  narrow: 'max-w-3xl',
  default: 'max-w-6xl',
  wide: 'max-w-7xl',
};

export function PageContainer({
  children,
  className,
  width = 'default',
  as: Tag = 'div',
}: {
  children: React.ReactNode;
  className?: string;
  width?: PageWidth;
  as?: 'div' | 'section' | 'main';
}) {
  return (
    <Tag
      className={cn(
        'mx-auto w-full px-4 sm:px-6 lg:px-8',
        widthClass[width],
        className,
      )}
    >
      {children}
    </Tag>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between',
        className,
      )}
    >
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-[var(--color-text-primary)] sm:text-3xl">
          {title}
        </h1>
        {description && (
          <p className="mt-2 max-w-2xl text-sm text-[var(--color-text-secondary)] sm:text-base">
            {description}
          </p>
        )}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </div>
  );
}
