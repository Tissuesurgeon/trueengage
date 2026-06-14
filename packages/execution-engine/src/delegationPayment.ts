import {
  createExecution,
  ExecutionMode,
  getSmartAccountsEnvironment,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import { DelegationManager } from '@metamask/smart-accounts-kit/contracts';
import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  erc20Abi,
  http,
  parseUnits,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

export type StoredSignedDelegation = Delegation;

export interface DelegationPaymentConfig {
  rpcUrl: string;
  relayerPrivateKey: Hex;
  usdcAddress: Hex;
  chainId?: number;
}

function asHexField(value: unknown, field: string): `0x${string}` {
  if (typeof value !== 'string' || !value.startsWith('0x')) {
    throw new Error(`Invalid signed delegation field: ${field}`);
  }
  return value as `0x${string}`;
}

/** Normalize MetaMask kit delegation (supports delegate/delegator or from/to aliases). */
function assertSignedDelegation(value: unknown): StoredSignedDelegation {
  if (!value || typeof value !== 'object') {
    throw new Error('Missing signed delegation in policy');
  }
  const d = value as Record<string, unknown>;

  const delegate = d.delegate ?? d.to;
  const delegator = d.delegator ?? d.from;
  const authority = d.authority ?? '0x0000000000000000000000000000000000000000000000000000000000000000';
  const signature = d.signature;
  const salt = d.salt ?? '0x00';

  if (!Array.isArray(d.caveats)) {
    throw new Error('Invalid signed delegation field: caveats');
  }

  return {
    delegate: asHexField(delegate, 'delegate'),
    delegator: asHexField(delegator, 'delegator'),
    authority: asHexField(authority, 'authority'),
    caveats: d.caveats as StoredSignedDelegation['caveats'],
    salt: asHexField(salt, 'salt'),
    signature: asHexField(signature, 'signature'),
  };
}

export function parseSignedDelegation(policy: Record<string, unknown>): StoredSignedDelegation {
  if (policy.signedDelegation) {
    return assertSignedDelegation(policy.signedDelegation);
  }
  throw new Error('No signedDelegation found — creator must grant MetaMask delegation');
}

export async function redeemUsdcViaDelegation(
  config: DelegationPaymentConfig,
  signedDelegation: StoredSignedDelegation,
  recipient: Hex,
  amountUsdc: number,
): Promise<Hex> {
  const chainId = config.chainId ?? sepolia.id;
  const account = privateKeyToAccount(config.relayerPrivateKey);
  const publicClient = createPublicClient({ chain: sepolia, transport: http(config.rpcUrl) });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(config.rpcUrl),
  });

  const amount = parseUnits(amountUsdc.toString(), 6);
  const callData = encodeFunctionData({
    abi: erc20Abi,
    functionName: 'transfer',
    args: [recipient, amount],
  });

  const execution = createExecution({
    target: config.usdcAddress,
    callData,
  });

  const redeemDelegationCalldata = DelegationManager.encode.redeemDelegations({
    delegations: [[signedDelegation]],
    modes: [ExecutionMode.SingleDefault],
    executions: [[execution]],
  });

  const environment = getSmartAccountsEnvironment(chainId);
  const hash = await walletClient.sendTransaction({
    to: environment.DelegationManager,
    data: redeemDelegationCalldata,
    account,
    chain: sepolia,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
