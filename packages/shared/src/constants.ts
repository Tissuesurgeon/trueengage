export const PRODUCT_NAME = 'TrueEngage';

export const TASK_CATEGORIES = [
  'social_media',
  'content_creation',
  'community',
  'marketing',
] as const;

export type TaskCategory = (typeof TASK_CATEGORIES)[number];

export const TASK_CATEGORY_LABELS: Record<TaskCategory, string> = {
  social_media: 'Social Media',
  content_creation: 'Content Creation',
  community: 'Community',
  marketing: 'Marketing',
};

export const AGENT_ROLES = ['campaign', 'verification', 'payment'] as const;
export type AgentRole = (typeof AGENT_ROLES)[number];

export const AGENT_LABELS: Record<AgentRole, string> = {
  campaign: 'Campaign Agent',
  verification: 'Venice Verification Agent',
  payment: 'Payment Agent',
};

export const CAMPAIGN_STATUSES = ['draft', 'active', 'closed', 'completed'] as const;
export type CampaignStatus = (typeof CAMPAIGN_STATUSES)[number];

export const SUBMISSION_STATUSES = [
  'pending',
  'verifying',
  'approved',
  'rejected',
  'paid',
] as const;
export type SubmissionStatus = (typeof SUBMISSION_STATUSES)[number];

export const DEFAULT_PERMISSION_LIMITS = {
  maxBudgetUsdc: 100,
  expirationDays: 7,
  allowedToken: 'USDC',
} as const;

/** Platform fee charged per campaign/task created */
export const PLATFORM_FEE_USDC = 1;

/** Official Circle USDC on Ethereum Sepolia testnet */
export const SEPOLIA_USDC_ADDRESS = '0x1c7D4B196Cb0C7B01d743Fbc6116a902379C7238';

/** Circle testnet USDC faucet */
export const SEPOLIA_USDC_FAUCET_URL = 'https://faucet.circle.com';
