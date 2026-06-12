'use client';

import { TASK_CATEGORIES, TASK_CATEGORY_LABELS } from '@trueengage/shared';
import { Input, Textarea } from '@/components/ui/input';
import { cn } from '@/lib/utils';

export interface CampaignFormData {
  title: string;
  description: string;
  category: string;
  taskRequirements: string;
  rewardUsdc: string;
  budgetUsdc: string;
  maxParticipants: string;
  deadline: string;
}

interface CampaignFormProps {
  data: CampaignFormData;
  onChange: (data: CampaignFormData) => void;
}

export function CampaignForm({ data, onChange }: CampaignFormProps) {
  function update(field: keyof CampaignFormData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
          Campaign Title
        </label>
        <Input
          value={data.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Promote our Web3 launch"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
          Description
        </label>
        <Textarea
          rows={3}
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe your engagement campaign..."
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
          Category
        </label>
        <select
          className={cn(
            'w-full rounded-xl border border-[var(--color-border)] bg-[var(--color-bg-surface-2)] px-4 py-2.5 text-sm text-[var(--color-text-primary)] outline-none focus:border-[var(--color-brand)]',
          )}
          value={data.category}
          onChange={(e) => update('category', e.target.value)}
        >
          {TASK_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {TASK_CATEGORY_LABELS[c]}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
          Task Requirements
        </label>
        <Textarea
          rows={5}
          value={data.taskRequirements}
          onChange={(e) => update('taskRequirements', e.target.value)}
          placeholder={'Mention @project\nInclude #Web3Launch\nMinimum 50 words\nPositive sentiment'}
        />
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
            Reward (USDC)
          </label>
          <Input
            type="number"
            value={data.rewardUsdc}
            onChange={(e) => update('rewardUsdc', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
            Budget (USDC)
          </label>
          <Input
            type="number"
            value={data.budgetUsdc}
            onChange={(e) => update('budgetUsdc', e.target.value)}
          />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
            Max Participants
          </label>
          <Input
            type="number"
            value={data.maxParticipants}
            onChange={(e) => update('maxParticipants', e.target.value)}
          />
        </div>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium text-[var(--color-text-secondary)]">
          Deadline
        </label>
        <Input
          type="datetime-local"
          value={data.deadline}
          onChange={(e) => update('deadline', e.target.value)}
        />
      </div>
    </div>
  );
}
