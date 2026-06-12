import type { CampaignRules } from '@trueengage/shared';

export function parseRequirementsText(text: string): CampaignRules {
  const lines = text
    .split('\n')
    .map((l) => l.trim())
    .filter(Boolean);

  const requirements: string[] = [];
  let minWordCount: number | undefined;
  let requiredMention: string | undefined;
  let requiredHashtag: string | undefined;
  let sentiment: CampaignRules['sentiment'] = 'any';

  for (const line of lines) {
    const lower = line.toLowerCase();
    if (lower.includes('minimum') && lower.includes('word')) {
      const match = line.match(/(\d+)/);
      if (match) minWordCount = parseInt(match[1], 10);
    } else if (lower.includes('mention') || lower.includes('@')) {
      const match = line.match(/@(\w+)/);
      requiredMention = match ? `@${match[1]}` : line;
      requirements.push(line);
    } else if (lower.includes('hashtag') || line.includes('#')) {
      const match = line.match(/#(\w+)/);
      requiredHashtag = match ? `#${match[1]}` : line;
      requirements.push(line);
    } else if (lower.includes('positive sentiment') || lower.includes('positive tone')) {
      sentiment = 'positive';
      requirements.push(line);
    } else {
      requirements.push(line);
    }
  }

  if (requirements.length === 0) {
    requirements.push(text.trim());
  }

  return {
    requirements,
    minWordCount,
    requiredMention,
    requiredHashtag,
    sentiment,
    proofTypes: ['url', 'screenshot', 'description'],
  };
}

export function hashRules(rules: CampaignRules): string {
  const payload = JSON.stringify(rules);
  let hash = 0;
  for (let i = 0; i < payload.length; i++) {
    hash = (hash << 5) - hash + payload.charCodeAt(i);
    hash |= 0;
  }
  return `0x${Math.abs(hash).toString(16).padStart(64, '0').slice(0, 64)}`;
}
