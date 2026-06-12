import { describe, expect, it } from 'vitest';
import { validateCampaignInput } from './validate.js';

describe('validateCampaignInput', () => {
  it('validates a correct campaign', () => {
    const result = validateCampaignInput({
      title: 'Test',
      description: 'A test campaign for Web3 engagement',
      taskRequirements: 'Mention @project\nInclude #hashtag',
      rewardUsdc: 2,
      budgetUsdc: 100,
      maxParticipants: 20,
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(result.valid).toBe(true);
    expect(result.rules.requirements.length).toBeGreaterThan(0);
    expect(result.rulesHash).toMatch(/^0x/);
  });

  it('rejects insufficient budget', () => {
    const result = validateCampaignInput({
      title: 'Test',
      description: 'A test campaign',
      taskRequirements: 'Do something',
      rewardUsdc: 10,
      budgetUsdc: 5,
      maxParticipants: 10,
      deadline: new Date(Date.now() + 86400000).toISOString(),
    });

    expect(result.valid).toBe(false);
    expect(result.errors.length).toBeGreaterThan(0);
  });
});
