import { Router, type IRouter } from 'express';
import { WalletConnectSchema, WalletDelegateSchema } from '@trueengage/shared';
import { isOneShotConfigured, storeDelegationOnOneShot } from '@trueengage/execution-engine';
import { delegationFromStored } from '@trueengage/smart-account-engine';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { loadEnv } from '../config/env.js';
import { prisma } from '../db/client.js';
import type { AgentOrchestrator } from '../services/agent-orchestrator.js';

export function walletRouter(orchestrator: AgentOrchestrator): IRouter {
  const router = Router();

  router.post('/wallet/connect', asyncHandler(async (req, res) => {
    const parsed = WalletConnectSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const { ownerEoa, smartAccountAddress, chainId } = parsed.data;
    const smartAccount = smartAccountAddress ?? ownerEoa;

    let user = await prisma.user.findUnique({ where: { address: ownerEoa } });
    if (!user) {
      user = await prisma.user.create({ data: { address: ownerEoa } });
    }

    const existing = await prisma.wallet.findFirst({
      where: { ownerEoa, smartAccountAddress: smartAccount },
    });

    const wallet =
      existing ??
      (await prisma.wallet.create({
        data: {
          userId: user.id,
          ownerEoa,
          smartAccountAddress: smartAccount,
          chainId: chainId ?? 11155111,
        },
      }));

    res.json({ walletId: wallet.id, ownerEoa, smartAccountAddress: smartAccount });
  }));

  router.post('/wallet/delegate', asyncHandler(async (req, res) => {
    const parsed = WalletDelegateSchema.safeParse(req.body);
    if (!parsed.success) return res.status(400).json({ error: parsed.error.flatten() });

    const {
      walletId,
      ownerEoa,
      smartAccountAddress,
      limits,
      policy,
      permissionContext,
      delegationManager,
      signedDelegation,
    } = parsed.data;
    const builtPolicy = {
      ...(policy ?? orchestrator.buildPolicy(ownerEoa, smartAccountAddress, limits)),
      ...(permissionContext ? { permissionContext } : {}),
      ...(delegationManager ? { delegationManager } : {}),
      ...(signedDelegation ? { signedDelegation } : {}),
    };
    const stored = delegationFromStored(ownerEoa, smartAccountAddress, limits, builtPolicy);

    const delegation = await prisma.delegation.create({
      data: {
        walletId,
        ownerEoa,
        smartAccountAddress,
        limits,
        policy: builtPolicy as unknown as import('@prisma/client').Prisma.InputJsonValue,
        expiresAt: new Date(stored.expiresAt),
      },
    });

    if (limits.campaignId) {
      await prisma.campaign.updateMany({
        where: { id: limits.campaignId, creatorAddress: ownerEoa },
        data: { walletId },
      });
    }

    if (signedDelegation) {
      const env = loadEnv();
      const oneShotConfig = {
        oneshotApiKey: env.ONESHOT_API_KEY,
        oneshotApiSecret: env.ONESHOT_API_SECRET,
        oneshotApiUrl: env.ONESHOT_API_URL,
        oneshotMethodId: env.ONESHOT_METHOD_ID,
        oneshotDelegatorMethodId: env.ONESHOT_DELEGATOR_METHOD_ID,
        oneshotWalletId: env.ONESHOT_WALLET_ID,
        chainId: env.CHAIN_ID,
      };
      if (isOneShotConfigured(oneShotConfig) && env.ONESHOT_WALLET_ID) {
        try {
          await storeDelegationOnOneShot(
            oneShotConfig,
            env.ONESHOT_WALLET_ID,
            signedDelegation,
          );
        } catch (err) {
          console.warn('[wallet/delegate] 1Shot delegation sync failed:', err);
        }
      }
    }

    res.json({ delegationId: delegation.id, policy: builtPolicy, granted: true });
  }));

  return router;
}
