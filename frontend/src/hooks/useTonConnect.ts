
// useTonConnect.ts
import { useEffect, useState, useCallback } from 'react';
import { TonConnect, toUserFriendlyAddress } from '@tonconnect/sdk';
import { useTonWallet } from '@tonconnect/ui-react';
import { WebApp } from '@twa-dev/sdk';
import { Address } from '@ton/core';
import { config } from '@/config';

interface UseTonConnectResult {
  connected: boolean;
  connecting: boolean;
  address: string | null;
  network: 'mainnet' | 'testnet';
  balance: string | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  sendTransaction: (params: {
    to: string;
    amount: string;
    message?: string;
  }) => Promise<void>;
}

const connector = new TonConnect({
  manifestUrl: config.tonconnect.manifestUrl,
  walletsListSource: config.tonconnect.walletsListSource
});

export function useTonConnect(): UseTonConnectResult {
  const wallet = useTonWallet();
  const connected = !!wallet;
  const [connecting, setConnecting] = useState(false);
  const [balance, setBalance] = useState<string | null>(null);
  const [network, setNetwork] = useState<'mainnet' | 'testnet'>(config.network);

  // Get user-friendly address
  const address = wallet ? 
    toUserFriendlyAddress(wallet.account.address, wallet.account.chain === 1) : 
    null;

  // Connect wallet
  const connect = useCallback(async () => {
    try {
      setConnecting(true);
      
      // Check platform and environment
      const isMobile = WebApp.platform === 'android' || WebApp.platform === 'ios';
      const universalUrl = config.tonconnect.universalUrl;

      if (isMobile) {
        // Mobile deep linking
        const tonkeeperUrl = `tonkeeper://v1/connect/ton-connect?connect=${encodeURIComponent(universalUrl)}`;
        WebApp.openLink(tonkeeperUrl);
      } else {
        // Desktop connection via QR or extension
        await connector.restoreConnection();
      }
    } catch (error) {
      console.error('Connection error:', error);
      WebApp.showAlert('Failed to connect wallet');
    } finally {
      setConnecting(false);
    }
  }, []);

  // Disconnect wallet
  const disconnect = useCallback(async () => {
    try {
      await connector.disconnect();
    } catch (error) {
      console.error('Disconnection error:', error);
      WebApp.showAlert('Failed to disconnect wallet');
    }
  }, []);

  // Send transaction
  const sendTransaction = useCallback(async ({
    to,
    amount,
    message = ''
  }: {
    to: string;
    amount: string;
    message?: string;
  }) => {
    if (!wallet) {
      throw new Error('Wallet not connected');
    }

    try {
      const transaction = {
        validUntil: Math.floor(Date.now() / 1000) + 600, // 10 minutes
        messages: [
          {
            address: to,
            amount: amount,
            payload: message
          }
        ]
      };

      // Request user confirmation through WebApp
      WebApp.showConfirm(
        `Send ${amount} TON to ${to}?${message ? `\nMessage: ${message}` : ''}`,
        async (confirmed: any) => {
          if (confirmed) {
            await connector.sendTransaction(transaction);
            WebApp.showAlert('Transaction sent successfully');
          }
        }
      );
    } catch (error) {
      console.error('Transaction error:', error);
      WebApp.showAlert('Failed to send transaction');
      throw error;
    }
  }, [wallet]);

  // Update balance
  useEffect(() => {
    if (!wallet?.account.address) return;

    const fetchBalance = async () => {
      try {
        const address = Address.parse(wallet.account.address);
        const response = await fetch(
          `${config.tonApiEndpoint}/address/${address}/balance`
        );
        const data = await response.json();
        setBalance(data.balance);
      } catch (error) {
        console.error('Balance fetch error:', error);
      }
    };

    fetchBalance();
    const interval = setInterval(fetchBalance, 10000); // Update every 10s

    return () => clearInterval(interval);
  }, [wallet?.account.address]);

  // Update network
  useEffect(() => {
    if (!wallet?.account.chain) return;
    setNetwork(wallet.account.chain === 'mainnet' ? 'mainnet' : 'testnet');
  }, [wallet?.account.chain]);

  return {
    connected,
    connecting,
    address,
    network,
    balance,
    connect,
    disconnect,
    sendTransaction
  };
}
