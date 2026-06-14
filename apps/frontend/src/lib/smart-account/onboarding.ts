'use client';

import type { Address } from 'viem';
import { createCreatorSmartAccount } from '@/lib/smart-account/smartAccount';
import {
  getEthereum,
  parseWalletError,
  requestMetaMaskAccounts,
  SEPOLIA_CHAIN_ID,
} from '@/lib/smart-account/metamask';

export { getEthereum };

export async function connectMetaMask(): Promise<{
  ownerEoa: Address;
  smartAccountAddress: Address;
  chainId: number;
}> {
  try {
    const ownerEoa = await requestMetaMaskAccounts();
    try {
      const { address: smartAccountAddress } = await Promise.race([
        createCreatorSmartAccount(ownerEoa),
        new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Smart account setup timed out')), 20_000);
        }),
      ]);
      return { ownerEoa, smartAccountAddress, chainId: SEPOLIA_CHAIN_ID };
    } catch (err) {
      console.warn('[wallet] Smart account preview failed — connected with EOA only:', err);
      return { ownerEoa, smartAccountAddress: ownerEoa, chainId: SEPOLIA_CHAIN_ID };
    }
  } catch (err) {
    throw new Error(parseWalletError(err));
  }
}
