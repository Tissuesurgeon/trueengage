import type { Env } from '../config/env.js';
import { prisma } from '../db/client.js';
import { createChainClients } from './chain-client.js';

const rewardReleasedAbi = [
  {
    type: 'event',
    name: 'RewardReleased',
    inputs: [
      { name: 'campaignId', type: 'uint256', indexed: true },
      { name: 'to', type: 'address', indexed: true },
      { name: 'amount', type: 'uint256', indexed: false },
    ],
  },
] as const;

export function startChainIndexer(env: Env) {
  if (!env.REWARD_ESCROW_ADDRESS) {
    console.warn('[indexer] REWARD_ESCROW_ADDRESS not set — skipping chain indexer');
    return;
  }

  const { publicClient } = createChainClients(env);

  publicClient.watchContractEvent({
    address: env.REWARD_ESCROW_ADDRESS as `0x${string}`,
    abi: rewardReleasedAbi,
    eventName: 'RewardReleased',
    onLogs: async (logs) => {
      for (const log of logs) {
        const { campaignId, to, amount } = log.args;
        if (campaignId === undefined || !to || amount === undefined) continue;

        const amountUsdc = Number(amount) / 1e6;
        const campaign = await prisma.campaign.findFirst({
          where: { onChainId: Number(campaignId) },
        });
        if (!campaign) continue;

        await prisma.campaign.update({
          where: { id: campaign.id },
          data: {
            escrowBalance: Math.max(0, campaign.escrowBalance - amountUsdc),
          },
        });
      }
    },
  });

  console.log('[indexer] Watching RewardReleased events on', env.REWARD_ESCROW_ADDRESS);
}
