import Link from 'next/link';
import { LOGO_MARK_VIEWBOX, LOGO_PURPLE } from '@/lib/brand/logo-mark';
import { cn } from '@/lib/utils';

type LogoSize = 'sm' | 'md' | 'lg';

const sizeConfig: Record<
  LogoSize,
  { text: string; mark: number; gap: string }
> = {
  sm: { text: 'text-sm sm:text-base', mark: 26, gap: 'gap-2' },
  md: { text: 'text-base sm:text-lg', mark: 32, gap: 'gap-2.5' },
  lg: { text: 'text-xl sm:text-2xl', mark: 40, gap: 'gap-3' },
};

export function LogoMark({
  size = 32,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={LOGO_MARK_VIEWBOX}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn('shrink-0', className)}
      aria-hidden
    >
      <rect x="3" y="3" width="30" height="30" rx="9" fill={LOGO_PURPLE} />
      <rect
        x="15"
        y="15"
        width="30"
        height="30"
        rx="9"
        stroke="currentColor"
        strokeWidth="3"
        fill="none"
      />
    </svg>
  );
}

export function Logo({
  size = 'md',
  href = '/',
  className,
  showText = true,
  markOnly = false,
}: {
  size?: LogoSize;
  href?: string | null;
  className?: string;
  showText?: boolean;
  markOnly?: boolean;
}) {
  const config = sizeConfig[size];

  const content = (
    <span
      className={cn(
        'inline-flex items-center font-mono font-bold leading-none tracking-tight',
        config.gap,
        !markOnly && config.text,
        className,
      )}
    >
      {showText && !markOnly && (
        <span className="whitespace-nowrap">
          <span className="text-[var(--color-logo-true)]">True</span>
          <span className="logo-engage">Engage</span>
        </span>
      )}
      <LogoMark
        size={config.mark}
        className="text-[var(--color-logo-true)]"
      />
    </span>
  );

  if (href) {
    return (
      <Link href={href} className="shrink-0 transition-opacity hover:opacity-90">
        {content}
      </Link>
    );
  }

  return <span className="shrink-0">{content}</span>;
}
