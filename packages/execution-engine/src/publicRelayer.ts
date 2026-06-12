import { encodeFunctionData, erc20Abi, parseUnits, type Hex } from 'viem';
import type { StoredSignedDelegation } from './delegationPayment.js';

const SEPOLIA_CHAIN_ID = 11155111;
const DEFAULT_RELAYER_URL = 'https://relayer.1shotapi.dev/relayers';
const STATUS_POLL_MS = 2500;
const STATUS_MAX_POLLS = 60;

export interface PublicRelayerConfig {
  relayerUrl?: string;
  chainId?: number;
  usdcAddress: Hex;
}

type RelayerCapabilities = {
  feeCollector: Hex;
  targetAddress: Hex;
  tokens: Array<{ address: Hex; symbol: string; decimals: string }>;
};

type FeeData = {
  minFee: string;
  context: string;
  feeCollector: Hex;
  targetAddress: Hex;
};

type EstimateResult = {
  success: boolean;
  error?: string;
  requiredPaymentAmount?: string;
  context?: string;
};

type StatusResult = {
  status: number;
  hash?: Hex;
  message?: string;
};

function relayerUrl(config: PublicRelayerConfig): string {
  return config.relayerUrl ?? DEFAULT_RELAYER_URL;
}

function chainIdStr(config: PublicRelayerConfig): string {
  return String(config.chainId ?? SEPOLIA_CHAIN_ID);
}

async function relayerRpc<T>(url: string, method: string, params: unknown): Promise<T> {
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });

  const payload = (await response.json()) as {
    result?: T;
    error?: { message?: string; code?: number };
  };

  if (payload.error) {
    throw new Error(
      `1Shot relayer ${method} failed (${payload.error.code ?? 'unknown'}): ${payload.error.message ?? 'unknown error'}`,
    );
  }

  if (payload.result === undefined) {
    throw new Error(`1Shot relayer ${method} returned empty result`);
  }

  return payload.result;
}

function toHexValue(value: unknown): string {
  if (typeof value === 'string') {
    return value.startsWith('0x') ? value : `0x${value}`;
  }
  if (typeof value === 'bigint') {
    return `0x${value.toString(16)}`;
  }
  if (typeof value === 'number') {
    return `0x${value.toString(16)}`;
  }
  throw new Error(`Cannot serialize value for relayer: ${String(value)}`);
}

/** Normalize MetaMask signed delegation to 1Shot permissionContext shape. */
export function serializeDelegationForRelayer(
  signedDelegation: StoredSignedDelegation | Record<string, unknown>,
): Record<string, unknown> {
  const d = signedDelegation as Record<string, unknown>;
  const caveats = Array.isArray(d.caveats) ? d.caveats : [];

  return {
    delegate: toHexValue(d.delegate ?? d.to),
    delegator: toHexValue(d.delegator ?? d.from),
    authority: toHexValue(d.authority ?? '0x0000000000000000000000000000000000000000'),
    caveats: caveats.map((c) => {
      const caveat = c as Record<string, unknown>;
      return {
        enforcer: toHexValue(caveat.enforcer),
        terms: toHexValue(caveat.terms ?? '0x'),
        args: toHexValue(caveat.args ?? '0x'),
      };
    }),
    salt: toHexValue(d.salt),
    signature: toHexValue(d.signature),
  };
}

function buildUsdcTransferExecution(
  usdcAddress: Hex,
  to: Hex,
  amountAtoms: bigint,
): { target: Hex; value: string; data: Hex } {
  return {
    target: usdcAddress,
    value: '0x0',
    data: encodeFunctionData({
      abi: erc20Abi,
      functionName: 'transfer',
      args: [to, amountAtoms],
    }),
  };
}

function parseMinFeeAtoms(minFee: string, decimals = 6): bigint {
  if (minFee.includes('.')) {
    return parseUnits(minFee, decimals);
  }
  return BigInt(minFee);
}

export async function getPublicRelayerCapabilities(
  config: PublicRelayerConfig,
): Promise<RelayerCapabilities> {
  const result = await relayerRpc<Record<string, RelayerCapabilities>>(
    relayerUrl(config),
    'relayer_getCapabilities',
    [chainIdStr(config)],
  );

  const caps = result[chainIdStr(config)];
  if (!caps?.targetAddress || !caps?.feeCollector) {
    throw new Error(`1Shot relayer does not support chain ${chainIdStr(config)}`);
  }

  return caps;
}

export async function getPublicRelayerInfo(config: PublicRelayerConfig) {
  const caps = await getPublicRelayerCapabilities(config);
  const usdc =
    caps.tokens.find((t) => t.symbol === 'USDC') ??
    caps.tokens[0];

  if (!usdc) {
    throw new Error('1Shot relayer has no accepted payment tokens on this chain');
  }

  return {
    chainId: Number(chainIdStr(config)),
    relayerUrl: relayerUrl(config),
    targetAddress: caps.targetAddress,
    feeCollector: caps.feeCollector,
    usdcAddress: usdc.address,
    usdcDecimals: Number(usdc.decimals),
  };
}

async function getFeeData(
  config: PublicRelayerConfig,
  paymentToken: Hex,
): Promise<FeeData> {
  return relayerRpc<FeeData>(relayerUrl(config), 'relayer_getFeeData', {
    chainId: chainIdStr(config),
    token: paymentToken,
  });
}

async function waitForTaskHash(url: string, taskId: string): Promise<Hex> {
  for (let i = 0; i < STATUS_MAX_POLLS; i++) {
    const status = await relayerRpc<StatusResult>(url, 'relayer_getStatus', {
      id: taskId,
      logs: false,
    });

    if (status.hash) {
      return status.hash;
    }

    if (status.status === 200) {
      throw new Error('1Shot relayer confirmed without transaction hash');
    }

    if (status.status === 400 || status.status === 500) {
      throw new Error(status.message ?? `1Shot relayer task failed (${status.status})`);
    }

    await new Promise((r) => setTimeout(r, STATUS_POLL_MS));
  }

  throw new Error('1Shot relayer task timed out waiting for transaction hash');
}

/**
 * Pay a campaign reward via the 1Shot public relayer (EIP-7710).
 * Requires creator delegation signed to relayer `targetAddress`.
 */
export async function payoutViaPublicRelayer(
  config: PublicRelayerConfig,
  signedDelegation: StoredSignedDelegation,
  recipient: Hex,
  amountUsdc: number,
): Promise<Hex> {
  const url = relayerUrl(config);
  const info = await getPublicRelayerInfo(config);
  const feeData = await getFeeData(config, config.usdcAddress);

  const delegate = (
    (signedDelegation as Record<string, unknown>).delegate ??
    (signedDelegation as Record<string, unknown>).to
  )?.toString()
    .toLowerCase();

  if (delegate !== info.targetAddress.toLowerCase()) {
    throw new Error(
      `Delegation delegate must be 1Shot targetAddress ${info.targetAddress}. ` +
        'Re-grant campaign permission after updating TrueEngage.',
    );
  }

  const feeAtoms = parseMinFeeAtoms(feeData.minFee, info.usdcDecimals);
  const rewardAtoms = parseUnits(amountUsdc.toString(), 6);

  const sendParams = {
    chainId: chainIdStr(config),
    transactions: [
      {
        permissionContext: [serializeDelegationForRelayer(signedDelegation)],
        executions: [
          buildUsdcTransferExecution(config.usdcAddress, info.feeCollector, feeAtoms),
          buildUsdcTransferExecution(config.usdcAddress, recipient, rewardAtoms),
        ],
      },
    ],
  };

  const estimate = await relayerRpc<EstimateResult>(
    url,
    'relayer_estimate7710Transaction',
    sendParams,
  );

  if (!estimate.success) {
    throw new Error(estimate.error ?? '1Shot relayer estimate failed');
  }

  const taskId = await relayerRpc<string>(url, 'relayer_send7710Transaction', {
    ...sendParams,
    context: estimate.context ?? feeData.context,
  });

  return waitForTaskHash(url, taskId);
}
