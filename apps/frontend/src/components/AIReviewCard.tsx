import type { VerificationResult } from '@trueengage/shared';
import { Bot } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

export function AIReviewCard({ result }: { result: VerificationResult }) {
  return (
    <Card variant="gradient">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-lg font-semibold">
          <Bot className="h-5 w-5 text-[var(--color-brand)]" />
          AI Analysis
        </h3>
        <Badge variant={result.approved ? 'success' : 'warning'}>
          {result.approved ? 'Approved' : 'Rejected'}
        </Badge>
      </div>

      <div className="space-y-4">
        <ScoreBlock label="Overall Score" value={result.score} />
        <ScoreBlock label="Task Match" value={result.requirementMatch} />
        <ScoreBlock label="Authenticity" value={result.authenticity} />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <Badge>Quality: {result.quality}</Badge>
        <Badge variant={result.spamRisk === 'low' ? 'success' : 'warning'}>
          Spam Risk: {result.spamRisk}
        </Badge>
      </div>

      <p className="mt-4 rounded-xl bg-[var(--color-bg-surface-2)] p-4 text-sm leading-relaxed text-[var(--color-text-secondary)]">
        {result.reason}
      </p>
    </Card>
  );
}

function ScoreBlock({ label, value }: { label: string; value: number }) {
  return (
    <div>
      <div className="mb-1 flex justify-between text-sm">
        <span className="text-[var(--color-text-muted)]">{label}</span>
        <span className="font-bold text-[var(--color-brand)]">{value}%</span>
      </div>
      <Progress value={value} max={100} variant="brand" size="sm" />
    </div>
  );
}
