const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(JSON.stringify(err));
  }
  return res.json() as Promise<T>;
}

export const api = {
  connectWallet: (body: { ownerEoa: string; smartAccountAddress?: string; chainId?: number }) =>
    request<{ walletId: string; ownerEoa: string; smartAccountAddress: string }>('/wallet/connect', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  delegate: (body: {
    walletId: string;
    ownerEoa: string;
    smartAccountAddress: string;
    limits: { maxBudgetUsdc: number; expirationDays: number; allowedToken: string; campaignId?: string };
    policy?: Record<string, unknown>;
    permissionContext?: string;
    delegationManager?: string;
    signedDelegation?: {
      delegate: string;
      delegator: string;
      authority: string;
      caveats: Array<{ enforcer: string; terms: string; args: string }>;
      salt: string;
      signature: string;
    };
  }) =>
    request<{ delegationId: string; policy: Record<string, unknown>; granted: boolean }>(
      '/wallet/delegate',
      { method: 'POST', body: JSON.stringify(body) },
    ),

  getCampaigns: (category?: string) =>
    request<import('@trueengage/shared').Campaign[]>(
      `/campaigns${category ? `?category=${category}` : ''}`,
    ),

  getMyCampaigns: (creator: string) =>
    request<import('@trueengage/shared').Campaign[]>(
      `/campaigns?creator=${encodeURIComponent(creator)}`,
    ),

  getCampaign: (id: string) => request<import('@trueengage/shared').Campaign>(`/campaigns/${id}`),

  getPlatformFee: () =>
    request<{ feeUsdc: number; treasuryAddress?: string; usdcAddress?: string }>('/platform/fee'),

  getPaymentAgent: () =>
    request<{
      paymentAgentAddress: string;
      chainId: number;
      usdcAddress?: string;
    }>('/platform/payment-agent'),

  getOneShotRelayer: () =>
    request<{
      chainId: number;
      relayerUrl: string;
      targetAddress: string;
      delegateAddress: string;
      feeCollector: string;
      usdcAddress: string;
      usdcDecimals: number;
    }>('/platform/oneshot-relayer'),

  createCampaign: (body: Record<string, unknown>) =>
    request<import('@trueengage/shared').Campaign>('/campaigns', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  depositCampaign: (id: string, body: { amountUsdc: number; txHash?: string }) =>
    request<import('@trueengage/shared').Campaign>(`/campaigns/${id}/deposit`, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  createSubmission: (body: {
    campaignId: string;
    participantAddress: string;
    proof: { url?: string; screenshotUrl?: string; description: string };
  }) =>
    request<import('@trueengage/shared').Submission>('/submissions', {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  verifySubmission: (id: string, creatorAddress: string) =>
    request<{
      submission: import('@trueengage/shared').Submission;
      verification: import('@trueengage/shared').VerificationResult;
      payment?: import('@trueengage/shared').PaymentResult;
      transaction?: { id: string; txHash?: string | null; status: string; amount: number };
    }>(`/submissions/${id}/verify`, {
      method: 'POST',
      body: JSON.stringify({ creatorAddress }),
    }),

  getSubmissions: (campaignId?: string) =>
    request<
      Array<
        import('@trueengage/shared').Submission & {
          verification?: unknown;
          transaction?: unknown;
        }
      >
    >(`/submissions${campaignId ? `?campaignId=${campaignId}` : ''}`),

  getAgentsActivity: () =>
    request<import('@trueengage/shared').AgentDecision[]>('/agents/activity'),
};
