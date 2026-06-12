import { createPublicClient, createWalletClient, http, type Hex } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { sepolia } from 'viem/chains';
import type { Env } from '../config/env.js';

export function createChainClients(env: Env) {
  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(env.SEPOLIA_RPC_URL),
  });

  let walletClient: ReturnType<typeof createWalletClient> | undefined;
  let account: ReturnType<typeof privateKeyToAccount> | undefined;

  if (env.RELAYER_PRIVATE_KEY) {
    account = privateKeyToAccount(env.RELAYER_PRIVATE_KEY as Hex);
    walletClient = createWalletClient({
      account,
      chain: sepolia,
      transport: http(env.SEPOLIA_RPC_URL),
    });
  }

  return { publicClient, walletClient, account };
}
