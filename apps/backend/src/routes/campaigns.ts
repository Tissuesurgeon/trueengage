import { Router, type IRouter } from 'express';
import { getPublicRelayerInfo } from '@trueengage/execution-engine';
import { privateKeyToAccount } from 'viem/accounts';
import { CreateCampaignSchema, DepositCampaignSchema, PLATFORM_FEE_USDC } from '@trueengage/shared';
import type { Campaign, CampaignRules, TaskCategory } from '@trueengage/shared';
import type { Env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { emitEvent } from '../ws/socket.js';
import type { AgentOrchestrator } from '../services/agent-orchestrator.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { getPlatformFeeConfig, verifyPlatformFeePayment } from '../services/platform-fee.js';
import { syncParticipantCount } from '../services/participant-count.js';
import { routeParam } from '../utils/routeParam.js';

function mapCampaign(c: {
  id: string;
  creatorAddress: string;
  title: string;
  description: string;
  category: string;
  rules: unknown;
  rewardUsdc: number;
  budgetUsdc: number;
  maxParticipants: number;
  participantCount: number;
  deadline: Date;
  status: string;
  onChainId: number | null;
  escrowBalance: number;
  platformFeeUsdc?: number;
  platformFeeTxHash?: string | null;
  createdAt: Date;
}): Campaign {
  return {
    id: c.id,
    creatorAddress: c.creatorAddress,
    title: c.title,
    description: c.description,
    category: c.category as TaskCategory,
    rules: c.rules as CampaignRules,
    rewardUsdc: c.rewardUsdc,
    budgetUsdc: c.budgetUsdc,
    maxParticipants: c.maxParticipants,
    participantCount: c.participantCount,
    deadline: c.deadline.toISOString(),
    status: c.status as Campaign['status'],
    onChainId: c.onChainId ?? undefined,
    escrowBalance: c.escrowBalance,
    platformFeeUsdc: c.platformFeeUsdc ?? PLATFORM_FEE_USDC,
    platformFeeTxHash: c.platformFeeTxHash ?? undefined,
    createdAt: c.createdAt.toISOString(),
  };
}

export function campaignsRouter(orchestrator: AgentOrchestrator, env: Env): IRouter {
  const router = Router();
  const feeConfig = getPlatformFeeConfig(env);

  router.get('/platform/fee', (_req, res) => {
    res.json({
      feeUsdc: PLATFORM_FEE_USDC,
      treasuryAddress: feeConfig.treasuryAddress,
      usdcAddress: feeConfig.usdcAddress,
    });
  });

  router.get('/platform/payment-agent', (_req, res) => {
    if (!env.RELAYER_PRIVATE_KEY) {
      return res.status(503).json({ error: 'Payment agent not configured' });
    }
    const paymentAgentAddress = privateKeyToAccount(
      env.RELAYER_PRIVATE_KEY as `0x${string}`,
    ).address;
    res.json({
      paymentAgentAddress,
      chainId: env.CHAIN_ID,
      usdcAddress: feeConfig.usdcAddress,
    });
  });

  router.get('/platform/oneshot-relayer', asyncHandler(async (_req, res) => {
    if (!feeConfig.usdcAddress) {
      return res.status(503).json({ error: 'USDC address not configured' });
    }
    const info = await getPublicRelayerInfo({
      relayerUrl: env.ONESHOT_RELAYER_URL,
      chainId: env.CHAIN_ID,
      usdcAddress: feeConfig.usdcAddress as `0x${string}`,
    });
    res.json({
      ...info,
      delegateAddress: info.targetAddress,
    });
  }));

  router.post('/campaigns', asyncHandler(async (req, res) => {
    const parsed = CreateCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const data = parsed.data;
    const agentResult = await orchestrator.runCampaignAgent({
      title: data.title,
      description: data.description,
      taskRequirements: data.taskRequirements,
      rewardUsdc: data.rewardUsdc,
      budgetUsdc: data.budgetUsdc,
      maxParticipants: data.maxParticipants,
      deadline: data.deadline,
    });

    if (!agentResult.valid) {
      return res.status(400).json({ error: 'Campaign validation failed', details: agentResult.errors });
    }

    const feeCheck = await verifyPlatformFeePayment(
      feeConfig,
      data.platformFeeTxHash as `0x${string}`,
      data.creatorAddress as `0x${string}`,
    );
    if (!feeCheck.valid) {
      return res.status(402).json({ error: 'Platform fee not verified', details: feeCheck.reason });
    }

    const maxOnChain = await prisma.campaign.aggregate({ _max: { onChainId: true } });
    const onChainId = (maxOnChain._max.onChainId ?? 0) + 1;

    const campaign = await prisma.campaign.create({
      data: {
        creatorAddress: data.creatorAddress,
        title: data.title,
        description: data.description,
        category: data.category,
        rules: agentResult.rules as unknown as import('@prisma/client').Prisma.InputJsonValue,
        rulesHash: agentResult.rulesHash,
        rewardUsdc: data.rewardUsdc,
        budgetUsdc: data.budgetUsdc,
        maxParticipants: data.maxParticipants,
        deadline: new Date(data.deadline),
        status: 'active',
        onChainId,
        platformFeeUsdc: PLATFORM_FEE_USDC,
        platformFeeTxHash: data.platformFeeTxHash,
      },
    });

    const mapped = mapCampaign(campaign);
    emitEvent({ type: 'campaignUpdated', campaign: mapped });
    res.status(201).json(mapped);
  }));

  router.get('/campaigns', asyncHandler(async (req, res) => {
    const category = req.query.category as string | undefined;
    const creator = req.query.creator as string | undefined;

    const where = creator
      ? { creatorAddress: creator }
      : category
        ? { category, status: 'active' as const }
        : { status: 'active' as const };

    const campaigns = await prisma.campaign.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        _count: {
          select: {
            submissions: {
              where: { status: { in: ['approved', 'paid'] } },
            },
          },
        },
      },
    });
    res.json(
      campaigns.map((c) =>
        mapCampaign({
          ...c,
          participantCount: c._count.submissions,
        }),
      ),
    );
  }));

  router.get('/campaigns/:id', asyncHandler(async (req, res) => {
    const id = routeParam(req.params.id);
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    const participantCount = await syncParticipantCount(campaign.id);
    res.json(mapCampaign({ ...campaign, participantCount }));
  }));

  router.post('/campaigns/:id/deposit', asyncHandler(async (req, res) => {
    const parsed = DepositCampaignSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const id = routeParam(req.params.id);
    const campaign = await prisma.campaign.findUnique({ where: { id } });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });

    const updated = await prisma.campaign.update({
      where: { id },
      data: {
        escrowBalance: campaign.escrowBalance + parsed.data.amountUsdc,
        status: 'active',
      },
    });

    const mapped = mapCampaign(updated);
    emitEvent({ type: 'campaignUpdated', campaign: mapped });
    res.json({ ...mapped, depositTxHash: parsed.data.txHash });
  }));

  router.post('/campaigns/:id/close', asyncHandler(async (req, res) => {
    const id = routeParam(req.params.id);
    const updated = await prisma.campaign.update({
      where: { id },
      data: { status: 'closed' },
    });
    const mapped = mapCampaign(updated);
    emitEvent({ type: 'campaignUpdated', campaign: mapped });
    res.json(mapped);
  }));

  return router;
}
