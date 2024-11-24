
// useBetContract.ts
import { useCallback, useState } from 'react';
import { useTonConnect } from './useTonConnect';
import { Address, beginCell, toNano } from '@ton/core';
import { WebApp } from '@twa-dev/sdk';
import { useToast } from '@/components/ui/use-toast';
import { config } from '@/config';

interface CreateBetParams {
  amount: string;
  description: string;
  expiryTime: number;
  maxParticipants: number;
}

interface BetDetails {
  id: string;
  amount: string;
  description: string;
  participants: string[];
  status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  winner?: string;
  expiryTime: number;
  creatorId: string;
}

export function useBetContract() {
  const { connected, address, sendTransaction } = useTonConnect();
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();

  const createBet = useCallback(async ({
    amount,
    description,
    expiryTime,
    maxParticipants
  }: CreateBetParams) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const betData = beginCell()
        .storeUint(0x123, 32) // op: create_bet
        .storeCoins(toNano(amount))
        .storeRef(
          beginCell()
            .storeString(description)
            .storeUint(expiryTime, 64)
            .storeUint(maxParticipants, 8)
            .endCell()
        )
        .endCell();

      await sendTransaction({
        to: config.contracts.bet.address,
        amount: toNano(amount),
        message: betData.toString('base64')
      });

      toast({
        title: 'Bet Created',
        description: 'Your bet has been created successfully'
      });
    } catch (error) {
      console.error('Create bet error:', error);
      toast({
        title: 'Error',
        description: 'Failed to create bet',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, address, sendTransaction, toast]);

  const joinBet = useCallback(async (betId: string, amount: string) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const joinData = beginCell()
        .storeUint(0x456, 32) // op: join_bet
        .storeUint(BigInt(betId), 256)
        .endCell();

      await sendTransaction({
        to: config.contracts.bet.address,
        amount: toNano(amount),
        message: joinData.toString('base64')
      });

      toast({
        title: 'Bet Joined',
        description: 'You have successfully joined the bet'
      });
    } catch (error) {
      console.error('Join bet error:', error);
      toast({
        title: 'Error',
        description: 'Failed to join bet',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, address, sendTransaction, toast]);

  const resolveBet = useCallback(async (betId: string, winnerId: string) => {
    if (!connected || !address) {
      throw new Error('Wallet not connected');
    }

    try {
      setLoading(true);

      const resolveData = beginCell()
        .storeUint(0x789, 32) // op: resolve_bet
        .storeUint(BigInt(betId), 256)
        .storeAddress(Address.parse(winnerId))
        .endCell();

      await sendTransaction({
        to: config.contracts.bet.address,
        amount: toNano('0.05'), // Gas fee
        message: resolveData.toString('base64')
      });

      toast({
        title: 'Bet Resolved',
        description: 'The bet has been resolved successfully'
      });
    } catch (error) {
      console.error('Resolve bet error:', error);
      toast({
        title: 'Error',
        description: 'Failed to resolve bet',
        variant: 'destructive'
      });
      throw error;
    } finally {
      setLoading(false);
    }
  }, [connected, address, sendTransaction, toast]);

  const getBetDetails = useCallback(async (betId: string): Promise<BetDetails> => {
    try {
      const response = await fetch(
        `${config.apiEndpoint}/bets/${betId}`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get bet details error:', error);
      throw error;
    }
  }, []);

  const getUserBets = useCallback(async (userId: string) => {
    try {
      const response = await fetch(
        `${config.apiEndpoint}/users/${userId}/bets`
      );
      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Get user bets error:', error);
      throw error;
    }
  }, []);

  return {
    loading,
    createBet,
    joinBet,
    resolveBet,
    getBetDetails,
    getUserBets
  };
}
