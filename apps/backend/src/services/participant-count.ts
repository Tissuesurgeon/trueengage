import { prisma } from '../db/client.js';

const COUNTED_SUBMISSION_STATUSES = ['approved', 'paid'] as const;

export async function countApprovedParticipants(campaignId: string): Promise<number> {
  return prisma.submission.count({
    where: {
      campaignId,
      status: { in: [...COUNTED_SUBMISSION_STATUSES] },
    },
  });
}

export async function syncParticipantCount(campaignId: string): Promise<number> {
  const count = await countApprovedParticipants(campaignId);
  await prisma.campaign.update({
    where: { id: campaignId },
    data: { participantCount: count },
  });
  return count;
}
