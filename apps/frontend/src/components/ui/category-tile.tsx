import Link from 'next/link';
import {
  Megaphone,
  MessageCircle,
  PenLine,
  Share2,
  type LucideIcon,
} from 'lucide-react';
import type { TaskCategory } from '@trueengage/shared';
import { TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { cn } from '@/lib/utils';

const CATEGORY_ICONS: Record<TaskCategory, LucideIcon> = {
  social_media: Share2,
  content_creation: PenLine,
  community: MessageCircle,
  marketing: Megaphone,
};

export function CategoryTile({
  category,
  className,
}: {
  category: TaskCategory;
  className?: string;
}) {
  const Icon = CATEGORY_ICONS[category];
  const label = TASK_CATEGORY_LABELS[category];

  return (
    <Link
      href={`/marketplace?category=${category}`}
      className={cn(
        'group flex flex-col items-center gap-3 rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface)] p-5 shadow-[var(--shadow-card)] transition-all duration-200 hover:-translate-y-0.5 hover:border-[var(--color-brand)]/30 hover:shadow-[var(--shadow-card-hover)] sm:p-6',
        className,
      )}
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-xl bg-[var(--color-brand)]/10 text-[var(--color-brand)] transition-all duration-300 group-hover:scale-110 group-hover:bg-[var(--color-brand)]/20">
        <Icon className="h-7 w-7" />
      </div>
      <span className="text-center text-sm font-semibold transition-colors group-hover:text-[var(--color-brand)]">
        {label}
      </span>
    </Link>
  );
}
