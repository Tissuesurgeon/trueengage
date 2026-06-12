import type { PaymentResult } from '@trueengage/shared';

export type SubmissionTransaction = {
  id?: string;
  txHash?: string | null;
  status?: string;
  amount?: number;
};

export function paymentFromSubmission(
  sub: {
    status: string;
    participantAddress: string;
    txHash?: string;
    transaction?: SubmissionTransaction | null;
  },
  rewardUsdc?: number,
): { payment?: PaymentResult; transactionId?: string } {
  const txHash = sub.txHash ?? sub.transaction?.txHash ?? undefined;
  const transactionId = sub.transaction?.id;
  const amountUsdc = sub.transaction?.amount ?? rewardUsdc ?? 0;

  if (sub.status === 'paid') {
    return {
      payment: {
        success: true,
        txHash,
        amountUsdc,
        recipient: sub.participantAddress,
      },
      transactionId,
    };
  }

  if (sub.status === 'approved') {
    return {
      payment: {
        success: false,
        txHash,
        amountUsdc,
        recipient: sub.participantAddress,
        error: 'Approved — payout pending or failed',
      },
      transactionId,
    };
  }

  return { transactionId };
}
