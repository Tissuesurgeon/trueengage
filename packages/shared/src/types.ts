import type {
  AgentRole,
  CampaignStatus,
  SubmissionStatus,
  TaskCategory,
} from './constants.js';

export interface CampaignRules {
  requirements: string[];
  minWordCount?: number;
  requiredMention?: string;
  requiredHashtag?: string;
  sentiment?: 'positive' | 'neutral' | 'any';
  proofTypes: ('url' | 'screenshot' | 'description')[];
}

export interface Campaign {
  id: string;
  creatorAddress: string;
  title: string;
  description: string;
  category: TaskCategory;
  rules: CampaignRules;
  rewardUsdc: number;
  budgetUsdc: number;
  maxParticipants: number;
  participantCount: number;
  deadline: string;
  status: CampaignStatus;
  onChainId?: number;
  escrowBalance?: number;
  platformFeeUsdc?: number;
  platformFeeTxHash?: string;
  createdAt: string;
}

export interface SubmissionProof {
  url?: string;
  screenshotUrl?: string;
  description: string;
}

export interface Submission {
  id: string;
  campaignId: string;
  participantAddress: string;
  proof: SubmissionProof;
  status: SubmissionStatus;
  aiScore?: number;
  aiReason?: string;
  txHash?: string;
  createdAt: string;
}

export interface VerificationResult {
  approved: boolean;
  score: number;
  quality: 'low' | 'medium' | 'high';
  requirementMatch: number;
  authenticity: number;
  spamRisk: 'low' | 'medium' | 'high';
  reason: string;
}

export interface DelegationLimits {
  maxBudgetUsdc: number;
  expirationDays: number;
  allowedToken: string;
  campaignId?: string;
}

export interface PaymentResult {
  success: boolean;
  txHash?: string;
  amountUsdc: number;
  recipient: string;
  error?: string;
}

export interface AgentDecision {
  id: string;
  role: AgentRole;
  input: unknown;
  output: unknown;
  timestamp: string;
}

export type SocketEvent =
  | { type: 'submissionCreated'; submission: Submission }
  | { type: 'verificationStarted'; submissionId: string }
  | { type: 'verificationCompleted'; submissionId: string; result: VerificationResult }
  | { type: 'paymentExecuted'; submissionId: string; result: PaymentResult }
  | { type: 'campaignUpdated'; campaign: Campaign }
  | { type: 'agentDecision'; decision: AgentDecision };
