import { CreateCampaignSchema } from '@trueengage/shared';
import type { CampaignRules } from '@trueengage/shared';
import { hashRules, parseRequirementsText } from './rules.js';

export interface CampaignAgentInput {
  title: string;
  description: string;
  taskRequirements: string;
  rewardUsdc: number;
  budgetUsdc: number;
  maxParticipants: number;
  deadline: string;
}

export interface CampaignAgentOutput {
  valid: boolean;
  rules: CampaignRules;
  rulesHash: string;
  errors: string[];
}

export function validateCampaignInput(input: CampaignAgentInput): CampaignAgentOutput {
  const errors: string[] = [];

  if (input.rewardUsdc <= 0) errors.push('Reward must be positive');
  if (input.budgetUsdc < input.rewardUsdc) {
    errors.push('Budget must be at least equal to reward amount');
  }
  if (input.maxParticipants <= 0) errors.push('Max participants must be positive');
  if (input.budgetUsdc < input.rewardUsdc * input.maxParticipants) {
    errors.push('Budget insufficient for max participants at reward rate');
  }

  const deadline = new Date(input.deadline);
  if (deadline <= new Date()) errors.push('Deadline must be in the future');

  const rules = parseRequirementsText(input.taskRequirements);
  if (rules.requirements.length === 0) {
    errors.push('At least one task requirement is required');
  }

  const rulesHash = hashRules(rules);

  return {
    valid: errors.length === 0,
    rules,
    rulesHash,
    errors,
  };
}

export function validateCreateCampaign(body: unknown) {
  return CreateCampaignSchema.safeParse(body);
}
