'use client';

import {
  createDelegation,
  ScopeType,
  type Delegation,
} from '@metamask/smart-accounts-kit';
import { SEPOLIA_USDC_ADDRESS } from '@trueengage/shared';
import type { Address } from 'viem';
import { parseUnits } from 'viem';
import { SEPOLIA_CHAIN_ID, parseWalletError } from '@/lib/smart-account/metamask';
import {
  createCreatorSmartAccount,
  deploySmartAccountIfNeeded,
} from '@/lib/smart-account/smartAccount';

const TRUEENGAGE_POLICY = {
  name: 'TrueEngage Campaign Payment Permission',
  description:
    'Authorize the 1Shot relayer to release USDC rewards for verified campaign submissions within your defined budget.',
  scope: 'campaign-reward-payments',
  version: '1.0',
};

export type SignedDelegation = Delegation;

export type DelegationGrantResult = {
  granted: boolean;
  policy: Record<string, unknown>;
  signedDelegation: SignedDelegation;
};

export async function requestDelegation(
  ownerEoa: Address,
  smartAccountAddress: Address,
  limits: Record<string, unknown>,
  paymentAgentAddress: Address,
  usdcAddress: Address = SEPOLIA_USDC_ADDRESS as Address,
): Promise<DelegationGrantResult> {
  const policy = {
    ...TRUEENGAGE_POLICY,
    smartAccountAddress,
    ownerEoa,
    limits,
    grantedAt: new Date().toISOString(),
  };

  const maxBudgetUsdc = Number(limits.maxBudgetUsdc);
  const expirationDays = Number(limits.expirationDays ?? 7);
  if (!Number.isFinite(maxBudgetUsdc) || maxBudgetUsdc <= 0) {
    throw new Error('Invalid campaign budget for delegation');
  }

  const { account: smartAccount } = await createCreatorSmartAccount(ownerEoa);
  if (smartAccount.address.toLowerCase() !== smartAccountAddress.toLowerCase()) {
    throw new Error('Smart account address mismatch — reconnect your wallet');
  }

  await deploySmartAccountIfNeeded(smartAccount, ownerEoa);

  const delegation = createDelegation({
    from: smartAccount.address,
    to: paymentAgentAddress,
    environment: smartAccount.environment,
    scope: {
      type: ScopeType.Erc20TransferAmount,
      tokenAddress: usdcAddress,
      maxAmount: parseUnits(maxBudgetUsdc.toString(), 6),
    },
  });

  let signature;
  try {
    signature = await smartAccount.signDelegation({
      delegation,
      chainId: SEPOLIA_CHAIN_ID,
    });
  } catch (err) {
    throw new Error(
      `Delegation signature failed: ${parseWalletError(err)}. Approve the MetaMask signature request to grant permission.`,
    );
  }

  const signedDelegation: SignedDelegation = {
    ...delegation,
    signature,
  };

  return {
    granted: true,
    policy: {
      ...policy,
      signedDelegation,
      expiresAt: new Date(Date.now() + expirationDays * 86400000).toISOString(),
    },
    signedDelegation,
  };
}
