'use client';

import { Input, Textarea } from '@/components/ui/input';
import { Button } from '@/components/ui/button';

export interface SubmissionFormData {
  url: string;
  screenshotUrl: string;
  description: string;
}

interface SubmissionFormProps {
  data: SubmissionFormData;
  onChange: (data: SubmissionFormData) => void;
  onSubmit: () => void;
  loading?: boolean;
  disabled?: boolean;
}

export function SubmissionForm({
  data,
  onChange,
  onSubmit,
  loading,
  disabled,
}: SubmissionFormProps) {
  function update(field: keyof SubmissionFormData, value: string) {
    onChange({ ...data, [field]: value });
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">Proof URL</label>
        <Input
          value={data.url}
          onChange={(e) => update('url', e.target.value)}
          placeholder="https://x.com/your-post"
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">Screenshot URL</label>
        <Input
          value={data.screenshotUrl}
          onChange={(e) => update('screenshotUrl', e.target.value)}
          placeholder="https://..."
        />
      </div>
      <div>
        <label className="mb-1.5 block text-sm text-[var(--color-text-secondary)]">Description</label>
        <Textarea
          rows={5}
          value={data.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe your completed task..."
        />
      </div>
      <Button onClick={onSubmit} disabled={loading || disabled} className="w-full">
        {loading ? 'Submitting...' : 'Submit for AI Review'}
      </Button>
    </div>
  );
}
