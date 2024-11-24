// types.ts
import { Address } from '@ton/core';
import { BetStatus } from '../../constants';

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  error?: {
    code: string;
    message: string;
  };
}

export interface Bet {
  id: string;
  creator: Address;
  amount: string;
  description: string;
  participants: Participant[];
  status: BetStatus;
  winner?: Address;
  createdAt: number;
  resolvedAt?: number;
}

export interface Participant {
  address: Address;
  joinedAt: number;
}

export interface CreateBetRequest {
  amount: string;
  description: string;
}

export interface JoinBetRequest {
  betId: string;
  amount: string;
}

export interface ResolveBetRequest {
  betId: string;
  winner: Address;
}

export interface GetBetsParams {
  status?: BetStatus;
  creator?: Address;
  participant?: Address;
  limit?: number;
  offset?: number;
}

export interface BetsResponse {
  bets: Bet[];
  total: number;
  hasMore: boolean;
}

export interface UserStats {
  totalBets: number;
  wonBets: number;
  totalVolume: string;
  netProfit: string;
}