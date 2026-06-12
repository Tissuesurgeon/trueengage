import { z } from 'zod';
import { AGENT_ROLES, CAMPAIGN_STATUSES, PLATFORM_FEE_USDC, TASK_CATEGORIES } from './constants.js';

export const CampaignRulesSchema = z.object({
  requirements: z.array(z.string()).min(1),
  minWordCount: z.number().optional(),
  requiredMention: z.string().optional(),
  requiredHashtag: z.string().optional(),
  sentiment: z.enum(['positive', 'neutral', 'any']).optional(),
  proofTypes: z.array(z.enum(['url', 'screenshot', 'description'])).default(['url', 'description']),
});

export const CreateCampaignSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  title: z.string().min(3).max(200),
  description: z.string().min(10),
  category: z.enum(TASK_CATEGORIES),
  taskRequirements: z.string().min(10),
  rewardUsdc: z.number().positive(),
  budgetUsdc: z.number().positive(),
  maxParticipants: z.number().int().positive(),
  deadline: z.string().datetime(),
  platformFeeTxHash: z.string().regex(/^0x[a-fA-F0-9]{64}$/),
});

export const PlatformFeeInfoSchema = z.object({
  feeUsdc: z.number().default(PLATFORM_FEE_USDC),
  treasuryAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  usdcAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
});

export const WalletConnectSchema = z.object({
  ownerEoa: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  smartAccountAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  chainId: z.number().optional(),
});

export const WalletDelegateSchema = z.object({
  walletId: z.string(),
  ownerEoa: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  smartAccountAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  limits: z.object({
    maxBudgetUsdc: z.number().positive(),
    expirationDays: z.number().int().positive().default(7),
    allowedToken: z.string().default('USDC'),
    campaignId: z.string().optional(),
  }),
  policy: z.record(z.unknown()).optional(),
  permissionContext: z.string().regex(/^0x[a-fA-F0-9]+$/).optional(),
  delegationManager: z.string().regex(/^0x[a-fA-F0-9]{40}$/).optional(),
  signedDelegation: z
    .object({
      delegate: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      delegator: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
      authority: z.string().regex(/^0x[a-fA-F0-9]+$/),
      caveats: z.array(
        z.object({
          enforcer: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
          terms: z.string().regex(/^0x[a-fA-F0-9]+$/),
          args: z.string().regex(/^0x[a-fA-F0-9]+$/),
        }),
      ),
      salt: z.string().regex(/^0x[a-fA-F0-9]+$/),
      signature: z.string().regex(/^0x[a-fA-F0-9]+$/),
    })
    .optional(),
});

export const SubmissionProofSchema = z.object({
  url: z.string().url().optional(),
  screenshotUrl: z.string().optional(),
  description: z.string().min(10),
});

export const CreateSubmissionSchema = z.object({
  campaignId: z.string(),
  participantAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
  proof: SubmissionProofSchema,
});

export const VerifySubmissionSchema = z.object({
  creatorAddress: z.string().regex(/^0x[a-fA-F0-9]{40}$/),
});

export const DepositCampaignSchema = z.object({
  amountUsdc: z.number().positive(),
  txHash: z.string().optional(),
});

export const VerificationResultSchema = z.object({
  approved: z.boolean(),
  score: z.number().min(0).max(100),
  quality: z.enum(['low', 'medium', 'high']),
  requirementMatch: z.number().min(0).max(100),
  authenticity: z.number().min(0).max(100),
  spamRisk: z.enum(['low', 'medium', 'high']),
  reason: z.string(),
});

export const AgentRoleSchema = z.enum(AGENT_ROLES);

export const CampaignStatusSchema = z.enum(CAMPAIGN_STATUSES);
