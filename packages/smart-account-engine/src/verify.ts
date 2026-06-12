import type { DelegationLimits } from '@trueengage/shared';
import type { StoredDelegation } from './delegation.js';

export interface PermissionCheck {
  allowed: boolean;
  reason?: string;
}

export function verifyDelegationActive(delegation: StoredDelegation | null): PermissionCheck {
  if (!delegation) return { allowed: false, reason: 'No delegation found' };
  if (!delegation.active) return { allowed: false, reason: 'Delegation is inactive' };
  if (new Date(delegation.expiresAt) < new Date()) {
    return { allowed: false, reason: 'Delegation has expired' };
  }
  return { allowed: true };
}

export function verifyPaymentWithinDelegation(
  delegation: StoredDelegation,
  amountUsdc: number,
  campaignId?: string,
  spentUsdc = 0,
): PermissionCheck {
  const activeCheck = verifyDelegationActive(delegation);
  if (!activeCheck.allowed) return activeCheck;

  const limits: DelegationLimits = delegation.limits;

  if (limits.campaignId && campaignId && limits.campaignId !== campaignId) {
    return { allowed: false, reason: 'Delegation not scoped to this campaign' };
  }

  if (spentUsdc + amountUsdc > limits.maxBudgetUsdc) {
    return {
      allowed: false,
      reason: `Would exceed max budget $${limits.maxBudgetUsdc} USDC`,
    };
  }

  return { allowed: true };
}
