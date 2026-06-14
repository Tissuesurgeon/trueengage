'use client';

import type { Address, Hex } from 'viem';
import {
  createPublicClient,
  createWalletClient,
  custom,
  encodeFunctionData,
  http,
  parseEther,
  parseUnits,
} from 'viem';
import { sepolia } from 'viem/chains';

export const SEPOLIA_CHAIN_ID = 11155111;
export const SEPOLIA_CHAIN_ID_HEX = '0xaa36a7';

type EthereumProvider = {
  isMetaMask?: boolean;
  providers?: EthereumProvider[];
  request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
  on?: (event: string, handler: (...args: unknown[]) => void) => void;
  removeListener?: (event: string, handler: (...args: unknown[]) => void) => void;
};

function getRpcUrl(): string {
  return process.env.NEXT_PUBLIC_SEPOLIA_RPC_URL ?? 'https://ethereum-sepolia-rpc.publicnode.com';
}

/** Prefer the MetaMask provider when multiple wallet extensions are installed. */
export function getEthereum(): EthereumProvider | undefined {
  if (typeof window === 'undefined') return undefined;

  const eth = (window as { ethereum?: EthereumProvider }).ethereum;
  if (!eth) return undefined;

  if (Array.isArray(eth.providers) && eth.providers.length > 0) {
    const metamask = eth.providers.find((p) => p.isMetaMask);
    if (metamask) return metamask;
  }

  return eth;
}

export function parseWalletError(err: unknown): string {
  if (typeof err === 'object' && err !== null) {
    const e = err as { code?: number; message?: string };
    if (e.code === 4001) {
      return 'Request rejected in MetaMask. Click Approve to continue.';
    }
    if (e.code === -32002) {
      return 'MetaMask already has a pending request. Open the extension and approve or reject it, then try again.';
    }
    if (e.code === 4902) {
      return 'Sepolia is not configured in MetaMask. Approve adding the network when prompted.';
    }
    if (e.message) return e.message;
  }
  return err instanceof Error ? err.message : 'MetaMask request failed';
}

export async function ensureSepoliaNetwork(): Promise<void> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error('MetaMask not installed');

  const chainIdHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
  if (parseInt(chainIdHex, 16) === SEPOLIA_CHAIN_ID) return;

  try {
    await ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: SEPOLIA_CHAIN_ID_HEX }],
    });
  } catch (err) {
    const code = typeof err === 'object' && err !== null ? (err as { code?: number }).code : undefined;
    if (code !== 4902) throw new Error(parseWalletError(err));

    await ethereum.request({
      method: 'wallet_addEthereumChain',
      params: [
        {
          chainId: SEPOLIA_CHAIN_ID_HEX,
          chainName: 'Sepolia',
          nativeCurrency: { name: 'Sepolia ETH', symbol: 'ETH', decimals: 18 },
          rpcUrls: [getRpcUrl()],
          blockExplorerUrls: ['https://sepolia.etherscan.io'],
        },
      ],
    });
  }

  const afterHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
  if (parseInt(afterHex, 16) !== SEPOLIA_CHAIN_ID) {
    throw new Error('Please switch MetaMask to Sepolia testnet');
  }
}

export async function requestMetaMaskAccounts(): Promise<Address> {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error('MetaMask not installed');

  await ensureSepoliaNetwork();

  const accounts = (await ethereum.request({ method: 'eth_requestAccounts' })) as Address[];
  if (!accounts[0]) throw new Error('No MetaMask account selected');
  return accounts[0];
}

export function createMetaMaskWalletClient(ownerEoa: Address) {
  const ethereum = getEthereum();
  if (!ethereum) throw new Error('MetaMask not installed');

  return createWalletClient({
    account: ownerEoa,
    chain: sepolia,
    transport: custom(ethereum),
  });
}

export function createSepoliaPublicClient() {
  return createPublicClient({
    chain: sepolia,
    transport: http(getRpcUrl()),
  });
}

export async function sendSepoliaTransaction(
  ownerEoa: Address,
  tx: { to: Address; value?: bigint; data?: Hex },
): Promise<Hex> {
  await ensureSepoliaNetwork();
  const walletClient = createMetaMaskWalletClient(ownerEoa);

  try {
    return await walletClient.sendTransaction({
      account: ownerEoa,
      chain: sepolia,
      to: tx.to,
      value: tx.value ?? BigInt(0),
      data: tx.data,
    });
  } catch (err) {
    throw new Error(parseWalletError(err));
  }
}

export async function transferUsdcFromEoa(
  usdcAddress: Address,
  to: Address,
  amountUsdc: number,
  ownerEoa: Address,
): Promise<Hex> {
  const amount = parseUnits(amountUsdc.toString(), 6);
  const data = encodeFunctionData({
    abi: [
      {
        name: 'transfer',
        type: 'function',
        stateMutability: 'nonpayable',
        inputs: [
          { name: 'to', type: 'address' },
          { name: 'amount', type: 'uint256' },
        ],
        outputs: [{ type: 'bool' }],
      },
    ] as const,
    functionName: 'transfer',
    args: [to, amount],
  });

  const txHash = await sendSepoliaTransaction(ownerEoa, {
    to: usdcAddress,
    data,
  });

  const client = createSepoliaPublicClient();
  await client.waitForTransactionReceipt({ hash: txHash });
  return txHash;
}

export async function fundSmartAccountDeployGas(
  ownerEoa: Address,
  smartAccountAddress: Address,
): Promise<void> {
  const txHash = await sendSepoliaTransaction(ownerEoa, {
    to: smartAccountAddress,
    value: parseEther('0.002'),
  });

  const client = createSepoliaPublicClient();
  await client.waitForTransactionReceipt({ hash: txHash });

  for (let i = 0; i < 20; i++) {
    const balance = await client.getBalance({ address: smartAccountAddress });
    if (balance > BigInt(0)) return;
    await new Promise((r) => setTimeout(r, 1500));
  }

  throw new Error('Smart account did not receive deploy gas — check MetaMask transaction status');
}

/** Log current chain for debugging failed approvals (dev only). */
export async function getConnectedChainId(): Promise<number | null> {
  const ethereum = getEthereum();
  if (!ethereum) return null;
  const chainIdHex = (await ethereum.request({ method: 'eth_chainId' })) as string;
  return parseInt(chainIdHex, 16);
}
