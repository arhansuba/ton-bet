// api.ts
import { BetStatus } from '../models/Bet';
import { Address } from '@ton/core';

// Request Types
export interface CreateBetRequest {
  amount: string;
  description: string;
  participants?: string[];
  expiryTime: number;
  betType: 'FRIEND' | 'BIG';
  metadata?: {
    category?: string;
    tags?: string[];
    customData?: any;
  };
}

export interface JoinBetRequest {
  userAddress: string;
}

export interface ResolveBetRequest {
  winnerId: string;
}

export interface CreateChannelRequest {
  counterpartyAddress: string;
  initialBalance: string;
  metadata?: {
    purpose: string;
    customData?: any;
  };
}

export interface UpdateChannelStateRequest {
  balanceA: string;
  balanceB: string;
  seqno: number;
  signature: string;
}

export interface CloseChannelRequest {
  finalBalanceA: string;
  finalBalanceB: string;
  signatures: {
    initiator: string;
    counterparty: string;
  };
}

// Response Types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    message: string;
    code?: string;
    details?: any;
  };
  meta?: {
    timestamp: number;
    requestId: string;
  };
}

export interface BetResponse {
  id: string;
  creatorId: string;
  amount: string;
  description: string;
  participants: string[];
  status: BetStatus;
  winner?: string;
  contractAddress?: string;
  expiryTime: number;
  createdAt: number;
  metadata?: {
    category?: string;
    tags?: string[];
    customData?: any;
  };
}

export interface ChannelResponse {
  id: string;
  userId: string;
  counterpartyId: string;
  channelAddress: string;
  initialBalance: string;
  currentBalanceA: string;
  currentBalanceB: string;
  seqno: number;
  status: 'PENDING' | 'OPEN' | 'CLOSING' | 'CLOSED';
  createdAt: number;
}

export interface UserStatsResponse {
  totalBets: number;
  wonBets: number;
  totalWagered: string;
  totalWon: string;
  totalLost: string;
  winRate: number;
}

export interface LeaderboardEntry {
  userId: string;
  username?: string;
  totalWon: string;
  wonBets: number;
  winRate: number;
  rank: number;
}

export interface TransactionResponse {
  txHash: string;
  blockHash: string;
  type: string;
  status: string;
  from: string;
  to: string;
  amount: string;
  timestamp: number;
}

// Query Parameters
export interface BetQueryParams {
  status?: BetStatus;
  userId?: string;
  betType?: 'FRIEND' | 'BIG';
  category?: string;
  page?: number;
  limit?: number;
  sort?: 'createdAt' | 'amount' | 'expiryTime';
  order?: 'asc' | 'desc';
}

export interface LeaderboardQueryParams {
  timeframe?: 'daily' | 'weekly' | 'monthly' | 'all';
  limit?: number;
}

// Webhook Types
export interface WebhookEvent<T = any> {
  type: string;
  data: T;
  timestamp: number;
  signature: string;
}

export interface TonEvent {
  contractAddress: Address;
  eventName: string;
  eventData: any;
  blockNumber: number;
  transactionHash: string;
}

// Service Types
export interface Pagination {
  page: number;
  limit: number;
  total: number;
  hasMore: boolean;
}

export interface ServiceResponse<T> {
  data: T;
  pagination?: Pagination;
}

export interface ServiceError extends Error {
  code?: string;
  statusCode?: number;
  details?: any;
}