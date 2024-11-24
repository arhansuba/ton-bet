// contract.ts
import { Address } from '@ton/core';

export const CONTRACT_ADDRESSES = {
  // Replace with actual contract addresses for each network
  MAINNET: Address.parse('EQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPrHF'),
  TESTNET: Address.parse('kQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPgpP'),
} as const;

export const CONTRACT_OPCODES = {
  CREATE_BET: 0x947c403e,
  JOIN_BET: 0x1d8129e2,
  RESOLVE: 0xb4028984,
  REFUND: 0x9942128d,
} as const;

export const BET_STATUS = {
  ACTIVE: 0,
  COMPLETED: 1,
  CANCELLED: 2,
} as const;

export const MIN_BET_AMOUNT = '1000000000'; // 1 TON in nanotons
export const PLATFORM_FEE = 5; // 5%

export const ERRORS = {
  INSUFFICIENT_AMOUNT: 'Bet amount must be at least 1 TON',
  INVALID_BET: 'Invalid bet ID',
  BET_CLOSED: 'Bet is no longer active',
  UNAUTHORIZED: 'Only contract owner can perform this action',
  AMOUNT_MISMATCH: 'Amount must match the bet amount',
} as const;

export type BetStatus = typeof BET_STATUS[keyof typeof BET_STATUS];