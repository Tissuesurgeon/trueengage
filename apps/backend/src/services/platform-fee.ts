import { createPublicClient, http, parseAbiItem, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import { PLATFORM_FEE_USDC } from '@trueengage/shared';
import type { Env } from '../config/env.js';

const transferEvent = parseAbiItem(
  'event Transfer(address indexed from, address indexed to, uint256 value)',
);

export interface PlatformFeeConfig {
  usdcAddress?: Hex;
  treasuryAddress?: Hex;
  rpcUrl: string;
}

export function getPlatformFeeConfig(env: Env): PlatformFeeConfig {
  let treasuryAddress = env.PLATFORM_TREASURY_ADDRESS as Hex | undefined;
  if (!treasuryAddress && env.RELAYER_PRIVATE_KEY) {
    treasuryAddress = privateKeyToAccount(env.RELAYER_PRIVATE_KEY as Hex).address;
  }

  return {
    usdcAddress: env.USDC_ADDRESS as Hex | undefined,
    treasuryAddress,
    rpcUrl: env.SEPOLIA_RPC_URL,
  };
}

export async function verifyPlatformFeePayment(
  config: PlatformFeeConfig,
  txHash: Hex,
  expectedPayer: Hex,
): Promise<{ valid: boolean; reason?: string }> {
  if (!config.usdcAddress || !config.treasuryAddress) {
    return { valid: true, reason: 'On-chain verification skipped (addresses not configured)' };
  }

  const client = createPublicClient({ chain: sepolia, transport: http(config.rpcUrl) });
  const receipt = await client.getTransactionReceipt({ hash: txHash });
  if (!receipt || receipt.status !== 'success') {
    return { valid: false, reason: 'Transaction not found or failed' };
  }

  const expectedAmount = BigInt(PLATFORM_FEE_USDC) * 1_000_000n;
  const logs = await client.getLogs({
    address: config.usdcAddress,
    event: transferEvent,
    fromBlock: receipt.blockNumber,
    toBlock: receipt.blockNumber,
  });

  const match = logs.find((log) => {
    const { from, to, value } = log.args;
    return (
      from?.toLowerCase() === expectedPayer.toLowerCase() &&
      to?.toLowerCase() === config.treasuryAddress!.toLowerCase() &&
      value === expectedAmount
    );
  });

  if (!match) {
    return {
      valid: false,
      reason: `Expected ${PLATFORM_FEE_USDC} USDC transfer from creator to platform treasury`,
    };
  }

  return { valid: true };
}
