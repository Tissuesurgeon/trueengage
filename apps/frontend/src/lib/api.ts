import type { SubmissionTransaction } from './submission-payment';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:4000';

function isDeployedFrontend(): boolean {
  return (
    typeof window !== 'undefined' &&
    !window.location.hostname.includes('localhost') &&
    !window.location.hostname.includes('127.0.0.1')
  );
}

function apiMisconfiguredMessage(): string | null {
  if (API_URL.includes('localhost') && isDeployedFrontend()) {
    return 'NEXT_PUBLIC_API_URL is not set for production. Add your Railway backend URL in Vercel → Environment Variables, then redeploy.';
  }
  return null;
}

function formatApiError(status: number, body: unknown): string {
  if (typeof body === 'object' && body !== null && 'error' in body) {
    const err = (body as { error?: unknown }).error;
    if (typeof err === 'string') return err;
    if (typeof err === 'object' && err !== null) return JSON.stringify(err);
  }
  return `Request failed (${status})`;
}

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options?.headers,
      },
    });
  } catch {
    const misconfigured = apiMisconfiguredMessage();
    if (misconfigured) throw new Error(misconfigured);
    throw new Error(
      `Cannot reach the API at ${API_URL}. If you are running locally, start the backend with "pnpm --filter @trueengage/backend dev". On Vercel, set NEXT_PUBLIC_API_URL to your Railway backend URL (https://…).`,
    );
  }
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    const message = formatApiError(res.status, err);
    if (res.status === 403 || res.status === 0) {
      throw new Error(
        `${message} — check that Railway FRONTEND_URL matches this site URL for CORS.`,
      );
    }
    throw new Error(message);
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
          verification?: import('@trueengage/shared').VerificationResult;
          transaction?: SubmissionTransaction | null;
        }
      >
    >(`/submissions${campaignId ? `?campaignId=${campaignId}` : ''}`),

  getAgentsActivity: () =>
    request<import('@trueengage/shared').AgentDecision[]>('/agents/activity'),
};
