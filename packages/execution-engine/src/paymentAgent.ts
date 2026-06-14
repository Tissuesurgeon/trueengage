import type { Hex } from 'viem';
import type { PaymentResult } from '@trueengage/shared';
import {
  redeemUsdcViaDelegation,
  type StoredSignedDelegation,
} from './delegationPayment.js';
import { releaseRewardFromEscrow } from './escrowPayment.js';
import {
  isOneShotConfigured,
  submitPayoutViaOneShot,
  type OneShotConfig,
} from './oneshot.js';
import { payoutViaPublicRelayer, type PublicRelayerConfig } from './publicRelayer.js';

export interface PaymentAgentConfig extends OneShotConfig, Omit<PublicRelayerConfig, 'chainId'> {
  rpcUrl: string;
  relayerPrivateKey?: Hex;
  rewardEscrowAddress?: Hex;
}

export type PaymentPath = 'oneshot-public-relayer' | 'oneshot-dev-platform' | 'delegation' | 'escrow';

export class PaymentAgent {
  constructor(private config: PaymentAgentConfig) {}

  async releaseReward(
    campaignOnChainId: number,
    recipient: Hex,
    amountUsdc: number,
    options?: {
      smartAccountAddress?: Hex;
      signedDelegation?: StoredSignedDelegation;
    },
  ): Promise<PaymentResult & { path?: PaymentPath }> {
    const attempts: Array<{ path: PaymentPath; error: string }> = [];

    if (!options?.signedDelegation) {
      console.warn(
        '[PaymentAgent] Skipping 1Shot public relayer — no signedDelegation (creator must grant permission)',
      );
    } else if (!this.config.usdcAddress || !this.config.relayerUrl) {
      console.warn(
        '[PaymentAgent] Skipping 1Shot public relayer — missing USDC_ADDRESS or ONESHOT_RELAYER_URL',
      );
    }

    if (options?.signedDelegation && this.config.usdcAddress && this.config.relayerUrl) {
      try {
        const txHash = await payoutViaPublicRelayer(
          {
            relayerUrl: this.config.relayerUrl,
            chainId: this.config.chainId,
            usdcAddress: this.config.usdcAddress,
          },
          options.signedDelegation,
          recipient,
          amountUsdc,
        );
        return {
          success: true,
          txHash,
          amountUsdc,
          recipient,
          path: 'oneshot-public-relayer',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attempts.push({ path: 'oneshot-public-relayer', error: message });
        console.warn('[PaymentAgent] 1Shot public relayer failed, trying fallback:', message);
      }
    }

    if (isOneShotConfigured(this.config)) {
      try {
        const txHash = await submitPayoutViaOneShot(this.config, {
          campaignOnChainId,
          recipient,
          amountUsdc,
          smartAccountAddress: options?.smartAccountAddress,
          signedDelegation: options?.signedDelegation,
        });
        return {
          success: true,
          txHash,
          amountUsdc,
          recipient,
          path: 'oneshot-dev-platform',
        };
      } catch (err) {
        const message = err instanceof Error ? err.message : String(err);
        attempts.push({ path: 'oneshot-dev-platform', error: message });
        console.warn('[PaymentAgent] 1Shot dev platform failed, trying fallback:', message);
      }
    }

    try {
      const txHash = await this.executeDirectRelease(
        campaignOnChainId,
        recipient,
        amountUsdc,
        options,
      );
      const path: PaymentPath =
        options?.signedDelegation && this.config.relayerPrivateKey && this.config.usdcAddress
          ? 'delegation'
          : 'escrow';
      return {
        success: true,
        txHash,
        amountUsdc,
        recipient,
        path,
      };
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      attempts.push({
        path: options?.signedDelegation ? 'delegation' : 'escrow',
        error: message,
      });
      return {
        success: false,
        amountUsdc,
        recipient,
        error: attempts.map((a) => `${a.path}: ${a.error}`).join(' | '),
      };
    }
  }

  private async executeDirectRelease(
    campaignOnChainId: number,
    recipient: Hex,
    amountUsdc: number,
    options?: {
      smartAccountAddress?: Hex;
      signedDelegation?: StoredSignedDelegation;
    },
  ): Promise<Hex> {
    const relayerKey = this.config.relayerPrivateKey;

    if (options?.signedDelegation && relayerKey && this.config.usdcAddress) {
      return redeemUsdcViaDelegation(
        {
          rpcUrl: this.config.rpcUrl,
          relayerPrivateKey: relayerKey,
          usdcAddress: this.config.usdcAddress,
          chainId: this.config.chainId,
        },
        options.signedDelegation,
        recipient,
        amountUsdc,
      );
    }

    if (relayerKey && this.config.rewardEscrowAddress) {
      return releaseRewardFromEscrow(
        {
          rpcUrl: this.config.rpcUrl,
          relayerPrivateKey: relayerKey,
          rewardEscrowAddress: this.config.rewardEscrowAddress,
        },
        campaignOnChainId,
        recipient,
        amountUsdc,
      );
    }

    throw new Error(
      'No payout path available — configure 1Shot (key, secret, method id) or relayer + escrow/delegation',
    );
  }
}
