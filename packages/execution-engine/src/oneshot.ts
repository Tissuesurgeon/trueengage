import { parseUnits, type Hex } from 'viem';

export interface OneShotConfig {
  oneshotApiKey?: string;
  oneshotApiSecret?: string;
  oneshotApiUrl?: string;
  oneshotMethodId?: string;
  oneshotDelegatorMethodId?: string;
  oneshotWalletId?: string;
  chainId: number;
}

type TokenCache = { token: string; expiresAt: number };
let tokenCache: TokenCache | null = null;

function apiBase(config: OneShotConfig): string {
  const raw = config.oneshotApiUrl ?? 'https://api.1shotapi.com';
  return raw.replace(/\/v\d+\/?$/, '').replace(/\/$/, '');
}

export function isOneShotConfigured(config: OneShotConfig): boolean {
  return !!(
    config.oneshotApiKey &&
    config.oneshotApiSecret &&
    (config.oneshotMethodId || config.oneshotDelegatorMethodId)
  );
}

async function getBearerToken(config: OneShotConfig): Promise<string> {
  if (!config.oneshotApiKey || !config.oneshotApiSecret) {
    throw new Error('1Shot API key and secret are required');
  }

  if (tokenCache && tokenCache.expiresAt > Date.now() + 30_000) {
    return tokenCache.token;
  }

  const response = await fetch(`${apiBase(config)}/v0/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: config.oneshotApiKey,
      client_secret: config.oneshotApiSecret,
      grant_type: 'client_credentials',
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`1Shot token error (${response.status}): ${err}`);
  }

  const data = (await response.json()) as {
    access_token?: string;
    expires_in?: number;
  };

  if (!data.access_token) {
    throw new Error('1Shot token response missing access_token');
  }

  tokenCache = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in ?? 3600) * 1000,
  };

  return data.access_token;
}

function extractTxHash(payload: unknown): Hex {
  if (!payload || typeof payload !== 'object') {
    throw new Error('Invalid 1Shot response payload');
  }

  const data = payload as Record<string, unknown>;
  const nested =
    data.data && typeof data.data === 'object'
      ? (data.data as Record<string, unknown>)
      : undefined;

  const candidates = [
    data.txHash,
    data.transactionHash,
    nested?.txHash,
    nested?.transactionHash,
  ];

  for (const value of candidates) {
    if (typeof value === 'string' && value.startsWith('0x')) {
      return value as Hex;
    }
  }

  throw new Error('Missing txHash from 1Shot response');
}

export function buildEscrowReleaseParams(
  campaignOnChainId: number,
  recipient: Hex,
  amountUsdc: number,
): Record<string, string | number> {
  return {
    campaignId: campaignOnChainId,
    to: recipient,
    amount: parseUnits(amountUsdc.toString(), 6).toString(),
  };
}

export function buildUsdcTransferParams(
  recipient: Hex,
  amountUsdc: number,
): Record<string, string> {
  return {
    to: recipient,
    value: parseUnits(amountUsdc.toString(), 6).toString(),
  };
}

async function postOneShot(
  config: OneShotConfig,
  path: string,
  body: Record<string, unknown>,
): Promise<Hex> {
  const token = await getBearerToken(config);
  const response = await fetch(`${apiBase(config)}${path}`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`1Shot API error (${response.status}): ${err}`);
  }

  const payload = await response.json();
  return extractTxHash(payload);
}

/** Execute a configured 1Shot contract method (e.g. RewardEscrow.releaseReward). */
export async function executeViaOneShot(
  config: OneShotConfig,
  methodId: string,
  params: Record<string, string | number>,
): Promise<Hex> {
  return postOneShot(config, `/v0/methods/${methodId}/execute`, { params });
}

/** Execute via stored delegator wallet (creator smart account delegation in 1Shot). */
export async function executeAsDelegatorViaOneShot(
  config: OneShotConfig,
  methodId: string,
  walletId: string,
  params: Record<string, string | number>,
): Promise<Hex> {
  return postOneShot(config, `/v0/methods/${methodId}/executeAsDelegator`, {
    walletId,
    params,
  });
}

/** Store signed ERC-7710 delegation on a 1Shot wallet for executeAsDelegator. */
export async function storeDelegationOnOneShot(
  config: OneShotConfig,
  walletId: string,
  signedDelegation: unknown,
): Promise<void> {
  const token = await getBearerToken(config);
  const response = await fetch(`${apiBase(config)}/v0/wallets/${walletId}/delegation`, {
    method: 'PUT',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(signedDelegation),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`1Shot delegation sync failed (${response.status}): ${err}`);
  }
}

export type OneShotPayoutInput = {
  campaignOnChainId: number;
  recipient: Hex;
  amountUsdc: number;
  smartAccountAddress?: Hex;
  signedDelegation?: unknown;
};

/**
 * Primary 1Shot payout: prefer executeAsDelegator (delegated USDC transfer) when configured,
 * otherwise execute escrow release method.
 */
export async function submitPayoutViaOneShot(
  config: OneShotConfig,
  input: OneShotPayoutInput,
): Promise<Hex> {
  if (!isOneShotConfigured(config)) {
    throw new Error('1Shot is not fully configured (key, secret, and method id required)');
  }

  if (
    config.oneshotWalletId &&
    config.oneshotDelegatorMethodId &&
    input.signedDelegation
  ) {
    return executeAsDelegatorViaOneShot(
      config,
      config.oneshotDelegatorMethodId,
      config.oneshotWalletId,
      buildUsdcTransferParams(input.recipient, input.amountUsdc),
    );
  }

  if (!config.oneshotMethodId) {
    throw new Error('ONESHOT_METHOD_ID is required for escrow release via 1Shot');
  }

  return executeViaOneShot(
    config,
    config.oneshotMethodId,
    buildEscrowReleaseParams(input.campaignOnChainId, input.recipient, input.amountUsdc),
  );
}
