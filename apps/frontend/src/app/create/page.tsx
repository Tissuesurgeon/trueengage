'use client';

import { Check, Coins, ExternalLink, FileText, Lock, Shield } from 'lucide-react';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { PLATFORM_FEE_USDC, SEPOLIA_USDC_FAUCET_URL } from '@trueengage/shared';
import { CampaignForm, type CampaignFormData } from '@/components/CampaignForm';
import { WalletPermissionModal } from '@/components/WalletPermissionModal';
import { useWalletContext } from '@/components/WalletProvider';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { api } from '@/lib/api';
import { requestDelegation } from '@/lib/smart-account/delegation';
import {
  createCreatorSmartAccount,
  deploySmartAccountIfNeeded,
} from '@/lib/smart-account/smartAccount';
import { transferUsdc } from '@/lib/usdc';
import { cn } from '@/lib/utils';

const STEPS = [
  { label: 'Define Task', icon: FileText },
  { label: 'Pay Fee & Create', icon: Coins },
  { label: 'Deposit Funds', icon: Lock },
  { label: 'Grant Permission', icon: Shield },
];

export default function CreateCampaignPage() {
  const router = useRouter();
  const { wallet, isConnected, connect } = useWalletContext();
  const [step, setStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [showPermission, setShowPermission] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [feeInfo, setFeeInfo] = useState<{
    feeUsdc: number;
    treasuryAddress?: string;
    usdcAddress?: string;
  }>({ feeUsdc: PLATFORM_FEE_USDC });
  const [form, setForm] = useState<CampaignFormData>({
    title: '',
    description: '',
    category: 'social_media',
    taskRequirements: '',
    rewardUsdc: '2',
    budgetUsdc: '100',
    maxParticipants: '20',
    deadline: '',
  });

  useEffect(() => {
    api.getPlatformFee().then(setFeeInfo).catch(console.error);
  }, []);

  async function ensureWallet() {
    if (wallet) return wallet;
    return connect();
  }

  async function handleCreate() {
    setLoading(true);
    try {
      const w = await ensureWallet();
      const deadline = form.deadline
        ? new Date(form.deadline).toISOString()
        : new Date(Date.now() + 7 * 86400000).toISOString();

      let platformFeeTxHash: string | undefined;
      if (feeInfo.usdcAddress && feeInfo.treasuryAddress) {
        platformFeeTxHash = await transferUsdc(
          feeInfo.usdcAddress as `0x${string}`,
          feeInfo.treasuryAddress as `0x${string}`,
          feeInfo.feeUsdc,
          w.ownerEoa as `0x${string}`,
        );
      } else {
        throw new Error(
          'Platform fee configuration unavailable. Set USDC_ADDRESS and PLATFORM_TREASURY_ADDRESS.',
        );
      }

      const campaign = await api.createCampaign({
        creatorAddress: w.ownerEoa,
        title: form.title,
        description: form.description,
        category: form.category,
        taskRequirements: form.taskRequirements,
        rewardUsdc: parseFloat(form.rewardUsdc),
        budgetUsdc: parseFloat(form.budgetUsdc),
        maxParticipants: parseInt(form.maxParticipants, 10),
        deadline,
        platformFeeTxHash,
      });
      setCampaignId(campaign.id);
      setStep(2);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to create campaign');
    } finally {
      setLoading(false);
    }
  }

  async function handleDeposit() {
    if (!campaignId) return;
    setLoading(true);
    try {
      const w = await ensureWallet();
      const budget = parseFloat(form.budgetUsdc);
      const fee = await api.getPlatformFee();
      if (!fee.usdcAddress) {
        throw new Error('USDC address not configured on backend');
      }

      const { account: smartAccount } = await createCreatorSmartAccount(
        w.ownerEoa as `0x${string}`,
      );
      await deploySmartAccountIfNeeded(smartAccount, w.ownerEoa as `0x${string}`);

      const depositTxHash = await transferUsdc(
        fee.usdcAddress as `0x${string}`,
        smartAccount.address,
        budget,
        w.ownerEoa as `0x${string}`,
      );

      await api.depositCampaign(campaignId, {
        amountUsdc: budget,
        txHash: depositTxHash,
      });
      setStep(3);
      setShowPermission(true);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to fund campaign wallet');
    } finally {
      setLoading(false);
    }
  }

  async function handleGrantPermission() {
    if (!campaignId) return;
    setLoading(true);
    try {
      const w = await ensureWallet();
      const limits = {
        maxBudgetUsdc: parseFloat(form.budgetUsdc),
        expirationDays: 7,
        allowedToken: 'USDC',
        campaignId,
      };
      const relayer = await api.getOneShotRelayer();
      const { policy, signedDelegation } = await requestDelegation(
        w.ownerEoa as `0x${string}`,
        w.smartAccountAddress as `0x${string}`,
        limits,
        relayer.delegateAddress as `0x${string}`,
        (relayer.usdcAddress ?? feeInfo.usdcAddress) as `0x${string}` | undefined,
      );
      await api.delegate({
        walletId: w.walletId,
        ownerEoa: w.ownerEoa,
        smartAccountAddress: w.smartAccountAddress,
        limits,
        policy,
        signedDelegation,
      });
      setShowPermission(false);
      router.push(`/campaigns/${campaignId}/progress`);
    } catch (err) {
      console.error(err);
      alert(err instanceof Error ? err.message : 'Failed to grant permission');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-6 sm:py-10">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-bold tracking-tight">Create Campaign</h1>
        <p className="mt-2 text-[var(--color-text-secondary)]">
          Launch an engagement campaign with AI verification and autonomous USDC rewards.
        </p>
      </div>

      <div className="mb-8">
        <div className="flex items-center justify-between">
          {STEPS.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={s.label} className="flex flex-1 flex-col items-center">
                <div className="flex w-full items-center">
                  {i > 0 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1',
                        done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
                      )}
                    />
                  )}
                  <div
                    className={cn(
                      'flex h-10 w-10 shrink-0 items-center justify-center rounded-full border-2 transition',
                      done && 'border-[var(--color-success)] bg-[var(--color-success)]/15 text-[var(--color-success)]',
                      active && 'border-[var(--color-brand)] bg-[var(--color-brand)]/15 text-[var(--color-brand)]',
                      !done && !active && 'border-[var(--color-border)] text-[var(--color-text-muted)]',
                    )}
                  >
                    {done ? <Check className="h-5 w-5" /> : <Icon className="h-4 w-4" />}
                  </div>
                  {i < STEPS.length - 1 && (
                    <div
                      className={cn(
                        'h-0.5 flex-1',
                        done ? 'bg-[var(--color-success)]' : 'bg-[var(--color-border)]',
                      )}
                    />
                  )}
                </div>
                <p
                  className={cn(
                    'mt-2 hidden text-center text-xs font-medium sm:block',
                    active ? 'text-[var(--color-text-primary)]' : 'text-[var(--color-text-muted)]',
                  )}
                >
                  {s.label}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {!isConnected && (
        <Card className="mb-6 border-[var(--color-warning)]/30 bg-[var(--color-warning)]/5">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Connect your wallet to create a campaign and pay the platform fee.
          </p>
          <Button className="mt-3" size="sm" onClick={() => connect().catch(console.error)}>
            Connect Wallet
          </Button>
        </Card>
      )}

      <Card>
        {step === 0 && (
          <>
            <CampaignForm data={form} onChange={setForm} />
            <Button className="mt-6 w-full" onClick={() => setStep(1)}>
              Continue
            </Button>
          </>
        )}

        {step === 1 && (
          <>
            <h2 className="mb-4 text-lg font-semibold">Review & pay platform fee</h2>
            <div className="space-y-3 rounded-xl bg-[var(--color-bg-surface-2)] p-4 text-sm">
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Reward per task</span>
                <span className="font-medium">{form.rewardUsdc} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Total budget</span>
                <span className="font-medium">{form.budgetUsdc} USDC</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[var(--color-text-muted)]">Max participants</span>
                <span className="font-medium">{form.maxParticipants}</span>
              </div>
              <div className="border-t border-[var(--color-border)] pt-3">
                <div className="flex justify-between font-medium">
                  <span>Platform fee</span>
                  <span className="text-[var(--color-brand)]">{feeInfo.feeUsdc} USDC</span>
                </div>
              </div>
            </div>
            <p className="mt-4 flex items-center gap-1 text-xs text-[var(--color-text-muted)]">
              Need testnet USDC?
              <a
                href={SEPOLIA_USDC_FAUCET_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-[var(--color-brand)] underline"
              >
                Circle faucet <ExternalLink className="h-3 w-3" />
              </a>
            </p>
            <div className="mt-6 flex gap-3">
              <Button variant="secondary" onClick={() => setStep(0)} className="flex-1">
                Back
              </Button>
              <Button onClick={handleCreate} disabled={loading} className="flex-1">
                {loading ? 'Processing...' : `Pay ${feeInfo.feeUsdc} USDC & Create`}
              </Button>
            </div>
          </>
        )}

        {step === 2 && (
          <>
            <h2 className="mb-2 text-lg font-semibold">Fund campaign wallet</h2>
            <p className="text-sm text-[var(--color-text-secondary)]">
              Approve two MetaMask prompts if needed: first deploy your smart account (one-time Sepolia
              ETH gas), then transfer {form.budgetUsdc} USDC into it. The 1Shot relayer releases
              rewards after AI approval.
            </p>
            <Button className="mt-6 w-full" onClick={handleDeposit} disabled={loading}>
              {loading ? 'Depositing...' : `Deposit ${form.budgetUsdc} USDC`}
            </Button>
          </>
        )}

        {step === 3 && !showPermission && (
          <div className="text-center">
            <Check className="mx-auto h-12 w-12 text-[var(--color-success)]" />
            <p className="mt-4 font-medium text-[var(--color-success)]">
              Campaign created and funded!
            </p>
          </div>
        )}
      </Card>

      <WalletPermissionModal
        open={showPermission}
        budgetUsdc={parseFloat(form.budgetUsdc)}
        onGrant={handleGrantPermission}
        onClose={() => setShowPermission(false)}
        loading={loading}
      />
    </div>
  );
}
