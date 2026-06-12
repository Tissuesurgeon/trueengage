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

function assertSignedDelegation(value: unknown): StoredSignedDelegation {
  if (!value || typeof value !== 'object') {
    throw new Error('Missing signed delegation in policy');
  }
  const d = value as Record<string, unknown>;
  const required = ['delegate', 'delegator', 'authority', 'caveats', 'salt', 'signature'] as const;
  for (const key of required) {
    if (typeof d[key] !== 'string' || !(d[key] as string).startsWith('0x')) {
      throw new Error(`Invalid signed delegation field: ${key}`);
    }
  }
  return value as StoredSignedDelegation;
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
