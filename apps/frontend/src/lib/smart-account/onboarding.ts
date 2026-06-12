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
    const { address: smartAccountAddress } = await createCreatorSmartAccount(ownerEoa);
    return { ownerEoa, smartAccountAddress, chainId: SEPOLIA_CHAIN_ID };
  } catch (err) {
    throw new Error(parseWalletError(err));
  }
}
