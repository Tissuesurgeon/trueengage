'use client';

import type { Address, Hex } from 'viem';
import { transferUsdcFromEoa } from '@/lib/smart-account/metamask';

export async function transferUsdc(
  usdcAddress: Address,
  to: Address,
  amountUsdc: number,
  from: Address,
): Promise<Hex> {
  return transferUsdcFromEoa(usdcAddress, to, amountUsdc, from);
}
