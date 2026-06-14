import { Router, type IRouter } from 'express';
import { CreateSubmissionSchema, VerifySubmissionSchema } from '@trueengage/shared';
import type { CampaignRules, Submission, SubmissionProof } from '@trueengage/shared';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { prisma } from '../db/client.js';
import { emitEvent } from '../ws/socket.js';
import type { AgentOrchestrator } from '../services/agent-orchestrator.js';
import {
  countApprovedParticipants,
  syncParticipantCount,
} from '../services/participant-count.js';
import { routeParam } from '../utils/routeParam.js';

function mapSubmission(s: {
  id: string;
  campaignId: string;
  participantAddress: string;
  proof: unknown;
  status: string;
  aiScore: number | null;
  aiReason: string | null;
  txHash: string | null;
  createdAt: Date;
}): Submission {
  return {
    id: s.id,
    campaignId: s.campaignId,
    participantAddress: s.participantAddress,
    proof: s.proof as SubmissionProof,
    status: s.status as Submission['status'],
    aiScore: s.aiScore ?? undefined,
    aiReason: s.aiReason ?? undefined,
    txHash: s.txHash ?? undefined,
    createdAt: s.createdAt.toISOString(),
  };
}

export function submissionsRouter(orchestrator: AgentOrchestrator): IRouter {
  const router = Router();

  router.post('/submissions', asyncHandler(async (req, res) => {
    const parsed = CreateSubmissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const campaign = await prisma.campaign.findUnique({
      where: { id: parsed.data.campaignId },
    });
    if (!campaign) return res.status(404).json({ error: 'Campaign not found' });
    if (campaign.status !== 'active') {
      return res.status(400).json({ error: 'Campaign is not active' });
    }
    const approvedCount = await countApprovedParticipants(campaign.id);
    if (approvedCount >= campaign.maxParticipants) {
      return res.status(400).json({ error: 'Campaign is full' });
    }
    if (
      campaign.creatorAddress.toLowerCase() === parsed.data.participantAddress.toLowerCase()
    ) {
      return res.status(403).json({ error: 'Creators cannot submit to their own campaign' });
    }

    const existingSubmission = await prisma.submission.findFirst({
      where: {
        campaignId: parsed.data.campaignId,
        participantAddress: {
          equals: parsed.data.participantAddress,
          mode: 'insensitive',
        },
        status: { not: 'rejected' },
      },
    });
    if (existingSubmission) {
      return res.status(409).json({ error: 'You have already participated in this campaign' });
    }

    const submission = await prisma.submission.create({
      data: {
        campaignId: parsed.data.campaignId,
        participantAddress: parsed.data.participantAddress,
        proof: parsed.data.proof,
        status: 'pending',
      },
    });

    const mapped = mapSubmission(submission);
    emitEvent({ type: 'submissionCreated', submission: mapped });
    res.status(201).json(mapped);
  }));

  router.get('/submissions', asyncHandler(async (req, res) => {
    const campaignId = req.query.campaignId as string | undefined;
    const submissions = await prisma.submission.findMany({
      where: campaignId ? { campaignId } : undefined,
      orderBy: { createdAt: 'desc' },
      include: { verification: true, transaction: true },
    });
    res.json(
      submissions.map((s: (typeof submissions)[number]) => ({
        ...mapSubmission(s),
        verification: s.verification,
        transaction: s.transaction,
      })),
    );
  }));

  router.get('/submissions/:id', asyncHandler(async (req, res) => {
    const id = routeParam(req.params.id);
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { verification: true, transaction: true, campaign: true },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    res.json({
      ...mapSubmission(submission),
      verification: submission.verification,
      transaction: submission.transaction,
      campaign: submission.campaign,
    });
  }));

  router.post('/submissions/:id/verify', asyncHandler(async (req, res) => {
    const parsed = VerifySubmissionSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const id = routeParam(req.params.id);
    const submission = await prisma.submission.findUnique({
      where: { id },
      include: { campaign: true },
    });
    if (!submission) return res.status(404).json({ error: 'Submission not found' });
    if (
      submission.campaign.creatorAddress.toLowerCase() !==
      parsed.data.creatorAddress.toLowerCase()
    ) {
      return res.status(403).json({ error: 'Only the campaign creator can verify submissions' });
    }
    if (submission.status !== 'pending') {
      return res.status(400).json({ error: 'Submission already processed' });
    }

    await prisma.submission.update({
      where: { id: submission.id },
      data: { status: 'verifying' },
    });

    const rules = submission.campaign.rules as unknown as CampaignRules;
    const proof = submission.proof as unknown as SubmissionProof;

    const verification = await orchestrator.runVerificationAgent(
      rules,
      submission.campaign.title,
      proof,
      submission.id,
    );

    await prisma.verification.create({
      data: {
        submissionId: submission.id,
        approved: verification.approved,
        score: verification.score,
        quality: verification.quality,
        requirementMatch: verification.requirementMatch,
        authenticity: verification.authenticity,
        spamRisk: verification.spamRisk,
        reason: verification.reason,
      },
    });

    if (!verification.approved) {
      const updated = await prisma.submission.update({
        where: { id: submission.id },
        data: {
          status: 'rejected',
          aiScore: verification.score,
          aiReason: verification.reason,
        },
      });
      const participantCount = await syncParticipantCount(submission.campaignId);
      emitEvent({
        type: 'campaignUpdated',
        campaign: { id: submission.campaignId, participantCount },
      });
      return res.json({ submission: mapSubmission(updated), verification });
    }

    const payment = await orchestrator.runPaymentAgent(
      submission.id,
      submission.campaignId,
      submission.participantAddress,
      submission.campaign.rewardUsdc,
      submission.campaign.onChainId ?? undefined,
      submission.campaign.walletId ?? undefined,
    );

    const transaction = await prisma.transaction.create({
      data: {
        submissionId: submission.id,
        wallet: submission.participantAddress,
        amount: submission.campaign.rewardUsdc,
        status: payment.success ? 'completed' : 'failed',
        txHash: 'txHash' in payment ? payment.txHash : undefined,
      },
    });

    const updated = await prisma.submission.update({
      where: { id: submission.id },
      data: {
        status: payment.success ? 'paid' : 'approved',
        aiScore: verification.score,
        aiReason: verification.reason,
        txHash: 'txHash' in payment ? payment.txHash : undefined,
      },
    });

    const participantCount = await syncParticipantCount(submission.campaignId);

    if (payment.success) {
      await prisma.campaign.update({
        where: { id: submission.campaignId },
        data: {
          escrowBalance: Math.max(
            0,
            submission.campaign.escrowBalance - submission.campaign.rewardUsdc,
          ),
        },
      });
    }

    emitEvent({
      type: 'campaignUpdated',
      campaign: { id: submission.campaignId, participantCount },
    });

    res.json({
      submission: mapSubmission(updated),
      verification,
      payment,
      transaction: {
        id: transaction.id,
        txHash: transaction.txHash,
        status: transaction.status,
        amount: transaction.amount,
      },
    });
  }));

  return router;
}
