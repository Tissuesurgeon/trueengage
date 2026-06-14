import { verifySubmission } from '@trueengage/ai-engine';
import { validateCampaignInput } from '@trueengage/campaign-engine';
import { parseSignedDelegation, PaymentAgent } from '@trueengage/execution-engine';
import type { CampaignRules, SubmissionProof, VerificationResult } from '@trueengage/shared';
import {
  buildDelegationPolicy,
  delegationFromStored,
  verifyPaymentWithinDelegation,
} from '@trueengage/smart-account-engine';
import type { Env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { emitEvent } from '../ws/socket.js';

export class AgentOrchestrator {
  private paymentAgent: PaymentAgent;

  constructor(private env: Env) {
    this.paymentAgent = new PaymentAgent({
      rpcUrl: env.SEPOLIA_RPC_URL,
      chainId: env.CHAIN_ID,
      relayerPrivateKey: env.RELAYER_PRIVATE_KEY as `0x${string}` | undefined,
      usdcAddress: env.USDC_ADDRESS as `0x${string}` | undefined,
      rewardEscrowAddress: env.REWARD_ESCROW_ADDRESS as `0x${string}` | undefined,
      oneshotApiKey: env.ONESHOT_API_KEY,
      oneshotApiSecret: env.ONESHOT_API_SECRET,
      oneshotApiUrl: env.ONESHOT_API_URL,
      oneshotMethodId: env.ONESHOT_METHOD_ID,
      oneshotDelegatorMethodId: env.ONESHOT_DELEGATOR_METHOD_ID,
      oneshotWalletId: env.ONESHOT_WALLET_ID,
      relayerUrl: env.ONESHOT_RELAYER_URL,
    });
  }

  async runCampaignAgent(input: {
    title: string;
    description: string;
    taskRequirements: string;
    rewardUsdc: number;
    budgetUsdc: number;
    maxParticipants: number;
    deadline: string;
  }) {
    const result = validateCampaignInput(input);
    void prisma.agentDecision
      .create({
        data: {
          role: 'campaign',
          input: input as unknown as import('@prisma/client').Prisma.InputJsonValue,
          output: result as unknown as import('@prisma/client').Prisma.InputJsonValue,
        },
      })
      .catch((err) => console.warn('[agent] campaign decision log failed:', err));
    emitEvent({
      type: 'agentDecision',
      decision: {
        id: crypto.randomUUID(),
        role: 'campaign',
        input,
        output: result,
        timestamp: new Date().toISOString(),
      },
    });
    return result;
  }

  async runVerificationAgent(
    campaignRules: CampaignRules,
    campaignTitle: string,
    submission: SubmissionProof,
    submissionId: string,
  ): Promise<VerificationResult> {
    emitEvent({ type: 'verificationStarted', submissionId });

    const { result, proofFetch } = await verifySubmission(
      { apiKey: this.env.VENICE_API_KEY, apiUrl: this.env.VENICE_API_URL },
      campaignRules,
      campaignTitle,
      submission,
    );

    await prisma.agentDecision.create({
      data: {
        role: 'verification',
        input: {
          campaignRules,
          submission,
          proofFetch,
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
        output: result as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    emitEvent({
      type: 'verificationCompleted',
      submissionId,
      result,
    });

    return result;
  }

  async runPaymentAgent(
    submissionId: string,
    campaignId: string,
    participantAddress: string,
    amountUsdc: number,
    onChainCampaignId?: number,
    walletId?: string,
  ) {
    let delegation = walletId
      ? await prisma.delegation.findFirst({
          where: { walletId, active: true },
          orderBy: { grantedAt: 'desc' },
        })
      : null;

    if (!delegation) {
      const campaign = await prisma.campaign.findUnique({
        where: { id: campaignId },
        select: { walletId: true },
      });
      if (campaign?.walletId) {
        delegation = await prisma.delegation.findFirst({
          where: { walletId: campaign.walletId, active: true },
          orderBy: { grantedAt: 'desc' },
        });
      }
    }

    if (delegation) {
      const stored = delegationFromStored(
        delegation.ownerEoa,
        delegation.smartAccountAddress,
        delegation.limits as { maxBudgetUsdc: number; expirationDays: number; allowedToken: string; campaignId?: string },
        delegation.policy as Record<string, unknown>,
      );
      stored.expiresAt = delegation.expiresAt.toISOString();

      const check = verifyPaymentWithinDelegation(stored, amountUsdc, campaignId);
      if (!check.allowed) {
        const fail = { success: false, amountUsdc, recipient: participantAddress, error: check.reason };
        emitEvent({ type: 'paymentExecuted', submissionId, result: fail });
        return fail;
      }
    }

    const policy = delegation?.policy as Record<string, unknown> | undefined;
    let signedDelegation;
    if (policy) {
      try {
        signedDelegation = parseSignedDelegation(policy);
      } catch (err) {
        console.warn(
          '[PaymentAgent] Could not parse signedDelegation from campaign policy:',
          err instanceof Error ? err.message : err,
        );
        signedDelegation = undefined;
      }
    }

    const result = await this.paymentAgent.releaseReward(
      onChainCampaignId ?? 1,
      participantAddress as `0x${string}`,
      amountUsdc,
      {
        smartAccountAddress: delegation?.smartAccountAddress as `0x${string}` | undefined,
        signedDelegation,
      },
    );

    await prisma.agentDecision.create({
      data: {
        role: 'payment',
        input: {
          submissionId,
          campaignId,
          amountUsdc,
          via: 'oneshot-primary',
        } as unknown as import('@prisma/client').Prisma.InputJsonValue,
        output: result as unknown as import('@prisma/client').Prisma.InputJsonValue,
      },
    });

    emitEvent({ type: 'paymentExecuted', submissionId, result });
    return result;
  }

  buildPolicy(
    ownerEoa: string,
    smartAccountAddress: string,
    limits: { maxBudgetUsdc: number; expirationDays: number; allowedToken: string; campaignId?: string },
  ) {
    return buildDelegationPolicy(ownerEoa, smartAccountAddress, limits);
  }
}
