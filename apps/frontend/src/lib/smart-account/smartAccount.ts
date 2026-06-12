'use client';

import {
  Implementation,
  toMetaMaskSmartAccount,
  type ToMetaMaskSmartAccountReturnType,
} from '@metamask/smart-accounts-kit';
import type { Address } from 'viem';
import { createPublicClient, http } from 'viem';
import { sepolia } from 'viem/chains';
import {
  createMetaMaskWalletClient,
  createSepoliaPublicClient,
  ensureSepoliaNetwork,
  parseWalletError,
  sendSepoliaTransaction,
} from '@/lib/smart-account/metamask';

const DEPLOY_SALT = '0x' as const;

export type CreatorSmartAccount = {
  ownerEoa: Address;
  address: Address;
  account: ToMetaMaskSmartAccountReturnType<Implementation.Hybrid>;
};

function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';
}

export async function createCreatorSmartAccount(ownerEoa: Address): Promise<CreatorSmartAccount> {
  await ensureSepoliaNetwork();

  const publicClient = createPublicClient({
    chain: sepolia,
    transport: http(getRpcUrl()),
  });

  const walletClient = createMetaMaskWalletClient(ownerEoa);

  const account = await toMetaMaskSmartAccount({
    client: publicClient,
    implementation: Implementation.Hybrid,
    deployParams: [ownerEoa, [], [], []],
    deploySalt: DEPLOY_SALT,
    signer: { walletClient },
  });

  return { ownerEoa, address: account.address, account };
}

export async function isSmartAccountDeployed(address: Address): Promise<boolean> {
  const publicClient = createSepoliaPublicClient();
  const bytecode = await publicClient.getBytecode({ address });
  return !!bytecode && bytecode !== '0x';
}

/**
 * Deploy the counterfactual smart account via SimpleFactory.
 * Uses a normal MetaMask transaction (per MetaMask docs) instead of a bundler user op.
 * @see https://docs.metamask.io/smart-accounts-kit/guides/smart-accounts/deploy-smart-account/
 */
export async function deploySmartAccountIfNeeded(
  smartAccount: CreatorSmartAccount['account'],
  ownerEoa: Address,
): Promise<void> {
  if (await isSmartAccountDeployed(smartAccount.address)) return;

  await ensureSepoliaNetwork();

  try {
    const { factory, factoryData } = await smartAccount.getFactoryArgs();
    if (!factory || !factoryData) {
      throw new Error('Smart account is already deployed or missing factory deploy data');
    }

    const txHash = await sendSepoliaTransaction(ownerEoa, {
      to: factory,
      data: factoryData,
    });

    const client = createSepoliaPublicClient();
    const receipt = await client.waitForTransactionReceipt({ hash: txHash });

    if (receipt.status === 'reverted') {
      throw new Error('Smart account factory transaction reverted on-chain');
    }

    if (!(await isSmartAccountDeployed(smartAccount.address))) {
      throw new Error(
        'Deploy transaction confirmed but smart account code was not found — try again in a minute',
      );
    }
  } catch (err) {
    throw new Error(
      `Smart account deployment failed: ${parseWalletError(err)}. Approve the MetaMask deploy transaction to continue.`,
    );
  }
}

export async function getCreatorSmartAccount(ownerEoa: Address): Promise<CreatorSmartAccount> {
  return createCreatorSmartAccount(ownerEoa);
}
