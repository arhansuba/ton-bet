// usePaymentChannel.ts
import { useCallback, useState, useEffect } from 'react';
import { useTonConnect } from './useTonConnect';
import { Address, beginCell, toNano } from '@ton/core';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config';

interface ChannelState {
  id: string;
  balanceA: string;
  balanceB: string;
  seqno: number;
  status: 'INIT' | 'OPEN' | 'CLOSING' | 'CLOSED';
  lastSignature?: string;
}

interface CreateChannelParams {
  counterpartyAddress: string;
  initialBalance: string;
  metadata?: {
    purpose: string;
    customData?: any;
  };
}

declare global {
  interface Window {
    tonkeeper: {
      signRawPayload: (payload: Uint8Array) => Promise<string>;
    };
  }
}

export function usePaymentChannel() {
  const { connected, address, sendTransaction } = useTonConnect();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const [channels, setChannels] = useState<ChannelState[]>([]);

  // Create payment channel
  const createChannel = useCallback(async ({
    counterpartyAddress,
    initialBalance,
    metadata
  }: CreateChannelParams) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const channelData = beginCell()
        .storeUint(0x1234, 32) // op: create_channel
        .storeAddress(Address.parse(counterpartyAddress))
        .storeCoins(toNano(initialBalance))
        .storeRef(
          beginCell()
            .storeBuffer(Buffer.from(metadata?.purpose || '', 'utf-8'))
            .storeDict(metadata?.customData || null)
            .endCell()
        )
        .endCell();

      await sendTransaction({
        to: config.contracts.paymentChannel.address,
        amount: toNano(initialBalance).toString(),
        message: channelData.toString('base64')
      });

      toast({
        title: 'Channel Created',
        description: 'Payment channel created successfully'
      });
    } catch (error) {
      console.error('Create channel error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create payment channel',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, address, sendTransaction, toast]);

  // Sign channel state
  const signState = useCallback(async (
    channelId: string,
    balanceA: string,
    balanceB: string,
    seqno: number
  ) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const stateData = beginCell()
        .storeUint(0x5678, 32) // op: sign_state
        .storeUint(BigInt(channelId), 256)
        .storeCoins(toNano(balanceA))
        .storeCoins(toNano(balanceB))
        .storeUint(seqno, 32)
        .endCell();

      const signature = await window.tonkeeper.signRawPayload(stateData.hash());
      
      await sendTransaction({
        to: config.contracts.paymentChannel.address,
        amount: toNano('0.05').toString(), // Gas fee
        message: stateData.toString('base64')
      });

      return signature;
    } catch (error) {
      console.error('Sign state error:', error);
      toast({
        title: 'Error',
        description: 'Failed to sign channel state',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, address, sendTransaction, toast]);

  // Close channel
  const closeChannel = useCallback(async (
    channelId: string,
    finalState: {
      balanceA: string;
      balanceB: string;
      signatures: {
        initiator: string;
        counterparty: string;
      };
    }
  ) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const closeData = beginCell()
        .storeUint(0x9abc, 32) // op: close_channel
        .storeUint(BigInt(channelId), 256)
        .storeCoins(toNano(finalState.balanceA))
        .storeCoins(toNano(finalState.balanceB))
        .storeRef(
          beginCell()
            .storeBuffer(Buffer.from(finalState.signatures.initiator, 'base64'))
            .storeBuffer(Buffer.from(finalState.signatures.counterparty, 'base64'))
            .endCell()
        )
        .endCell();

      await sendTransaction({
        to: config.contracts.paymentChannel.address,
        amount: toNano('0.1').toString(), // Gas fee
        message: closeData.toString('base64')
      });

      toast({
        title: 'Channel Closed',
        description: 'Payment channel closed successfully'
      });
    } catch (error) {
      console.error('Close channel error:', error);
      toast({
        title: 'Error',
        description: 'Failed to close channel',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, address, sendTransaction, toast]);

  // Get channel state
  const getChannelState = useCallback(async (channelId: string): Promise<ChannelState> => {
    try {
      const response = await fetch(
        `${config.apiEndpoint}/channels/${channelId}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get channel state error:', error);
      throw error;
    }
  }, []);

  // Load user channels
  useEffect(() => {
    if (!connected || !address) return;

    const loadChannels = async () => {
      try {
        const response = await fetch(
          `${config.apiEndpoint}/users/${address}/channels`
        );
        const data = await response.json();
        setChannels(data);
      } catch (error) {
        console.error('Load channels error:', error);
      }
    };

    loadChannels();
  }, [connected, address]);

  return {
    loading,
    channels,
    createChannel,
    signState,
    closeChannel,
    getChannelState
  };
}