import {
  createPublicClient,
  createWalletClient,
  encodeFunctionData,
  http,
  parseUnits,
  type Hex,
} from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';

const rewardEscrowAbi = [
  {
    name: 'releaseReward',
    type: 'function',
    stateMutability: 'nonpayable',
    inputs: [
      { name: 'campaignId', type: 'uint256' },
      { name: 'to', type: 'address' },
      { name: 'amount', type: 'uint256' },
    ],
    outputs: [],
  },
] as const;

export interface EscrowPaymentConfig {
  rpcUrl: string;
  relayerPrivateKey: Hex;
  rewardEscrowAddress: Hex;
}

export async function releaseRewardFromEscrow(
  config: EscrowPaymentConfig,
  campaignOnChainId: number,
  recipient: Hex,
  amountUsdc: number,
): Promise<Hex> {
  const account = privateKeyToAccount(config.relayerPrivateKey);
  const publicClient = createPublicClient({ chain: sepolia, transport: http(config.rpcUrl) });
  const walletClient = createWalletClient({
    account,
    chain: sepolia,
    transport: http(config.rpcUrl),
  });

  const data = encodeFunctionData({
    abi: rewardEscrowAbi,
    functionName: 'releaseReward',
    args: [BigInt(campaignOnChainId), recipient, parseUnits(amountUsdc.toString(), 6)],
  });

  const hash = await walletClient.sendTransaction({
    to: config.rewardEscrowAddress,
    data,
    account,
    chain: sepolia,
  });

  await publicClient.waitForTransactionReceipt({ hash });
  return hash;
}
