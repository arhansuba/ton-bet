// types.ts
import { Address } from '@ton/core';

export interface ContractState {
  balance: string;
  status: ContractStatus;
  lastUpdateTime: number;
}

export enum ContractStatus {
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  CLOSED = 'CLOSED'
}

export interface BetContractData {
  amount: string;
  description: string;
  participants: string[];
  winner?: string;
}

export interface ChannelState {
  balanceA: string;
  balanceB: string;
  seqno: number;
  status: ChannelStatus;
}

export enum ChannelStatus {
  OPEN = 'OPEN',
  CLOSING = 'CLOSING',
  CHALLENGED = 'CHALLENGED',
  CLOSED = 'CLOSED'
}

export interface SignedState {
  signature: string;
  state: {
    balanceA: string;
    balanceB: string;
    seqno: number;
  }
}

export interface CloseChannelData {
  finalBalanceA: string;
  finalBalanceB: string;
  signatures: {
    initiator: string;
    counterparty: string;
  }
}