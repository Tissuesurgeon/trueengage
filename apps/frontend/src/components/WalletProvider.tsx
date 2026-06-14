'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { api } from '@/lib/api';
import { connectMetaMask, getEthereum } from '@/lib/smart-account/onboarding';

const STORAGE_KEY = 'trueengage_wallet';

export interface WalletState {
  walletId: string;
  ownerEoa: string;
  smartAccountAddress: string;
}

type WalletStatus = 'disconnected' | 'connecting' | 'connected';

interface WalletContextValue {
  wallet: WalletState | null;
  address: string | null;
  walletId: string | null;
  smartAccountAddress: string | null;
  status: WalletStatus;
  isConnected: boolean;
  connect: () => Promise<WalletState>;
  disconnect: () => void;
}

const WalletContext = createContext<WalletContextValue | null>(null);

function readStoredWallet(): WalletState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as WalletState;
  } catch {
    return null;
  }
}

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [wallet, setWallet] = useState<WalletState | null>(null);
  const [status, setStatus] = useState<WalletStatus>('disconnected');
  const [hydrated, setHydrated] = useState(false);
  const connectingRef = useRef(false);

  useEffect(() => {
    const stored = readStoredWallet();
    if (stored) {
      setWallet(stored);
      setStatus('connected');
    }
    setHydrated(true);
  }, []);

  const disconnect = useCallback(() => {
    setWallet(null);
    setStatus('disconnected');
    localStorage.removeItem(STORAGE_KEY);
  }, []);

  const connect = useCallback(async () => {
    connectingRef.current = true;
    setStatus('connecting');
    try {
      const { ownerEoa, smartAccountAddress, chainId } = await connectMetaMask();
      const result = await api.connectWallet({
        ownerEoa,
        smartAccountAddress,
        chainId,
      });
      const w: WalletState = {
        walletId: result.walletId,
        ownerEoa,
        smartAccountAddress: result.smartAccountAddress,
      };
      setWallet(w);
      setStatus('connected');
      localStorage.setItem(STORAGE_KEY, JSON.stringify(w));
      return w;
    } catch (err) {
      setStatus(wallet ? 'connected' : 'disconnected');
      throw err;
    } finally {
      connectingRef.current = false;
    }
  }, [wallet]);

  useEffect(() => {
    if (!hydrated) return;
    const ethereum = getEthereum();
    if (!ethereum?.on) return;

    const handleAccountsChanged = (accounts: unknown) => {
      if (connectingRef.current) return;
      const list = accounts as string[];
      if (!list?.length) {
        disconnect();
        return;
      }
      if (wallet && list[0].toLowerCase() !== wallet.ownerEoa.toLowerCase()) {
        disconnect();
      }
    };

    const handleChainChanged = () => {
      if (connectingRef.current) return;
      disconnect();
    };

    ethereum.on('accountsChanged', handleAccountsChanged);
    ethereum.on('chainChanged', handleChainChanged);

    return () => {
      ethereum.removeListener?.('accountsChanged', handleAccountsChanged);
      ethereum.removeListener?.('chainChanged', handleChainChanged);
    };
  }, [hydrated, wallet, disconnect]);

  const value = useMemo<WalletContextValue>(
    () => ({
      wallet,
      address: wallet?.ownerEoa ?? null,
      walletId: wallet?.walletId ?? null,
      smartAccountAddress: wallet?.smartAccountAddress ?? null,
      status,
      isConnected: status === 'connected' && !!wallet,
      connect,
      disconnect,
    }),
    [wallet, status, connect, disconnect],
  );

  return <WalletContext.Provider value={value}>{children}</WalletContext.Provider>;
}

export function useWalletContext() {
  const ctx = useContext(WalletContext);
  if (!ctx) throw new Error('useWalletContext must be used within WalletProvider');
  return ctx;
}

/** @deprecated Use useWalletContext instead */
export function useWallet() {
  return useWalletContext().wallet;
}
