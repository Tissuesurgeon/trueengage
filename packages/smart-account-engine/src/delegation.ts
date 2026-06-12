import type { DelegationLimits } from '@trueengage/shared';

export const TRUEENGAGE_POLICY = {
  name: 'TrueEngage Campaign Payment Permission',
  description:
    'Delegate limited USDC spending authority to the TrueEngage payment agent for verified campaign rewards.',
  scope: 'campaign-reward-payments',
  version: '1.0',
};

export interface StoredDelegation {
  ownerEoaAddress: string;
  smartAccountAddress: string;
  limits: DelegationLimits;
  policy: Record<string, unknown>;
  grantedAt: string;
  expiresAt: string;
  active: boolean;
}

export function buildDelegationPolicy(
  ownerEoa: string,
  smartAccountAddress: string,
  limits: DelegationLimits,
): Record<string, unknown> {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + limits.expirationDays);

  return {
    ...TRUEENGAGE_POLICY,
    ownerEoa,
    smartAccountAddress,
    limits,
    allowedToken: limits.allowedToken,
    maxBudgetUsdc: limits.maxBudgetUsdc,
    campaignId: limits.campaignId,
    grantedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
  };
}

export function delegationFromStored(
  ownerEoa: string,
  smartAccountAddress: string,
  limits: DelegationLimits,
  policy?: Record<string, unknown>,
): StoredDelegation {
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + limits.expirationDays);

  return {
    ownerEoaAddress: ownerEoa,
    smartAccountAddress,
    limits,
    policy: policy ?? buildDelegationPolicy(ownerEoa, smartAccountAddress, limits),
    grantedAt: new Date().toISOString(),
    expiresAt: expiresAt.toISOString(),
    active: true,
  };
}
