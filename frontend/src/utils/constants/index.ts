// index.ts
export * from './contract';
export * from './app';

export const NETWORKS = {
  MAINNET: 'mainnet',
  TESTNET: 'testnet',
} as const;

export const EVENTS = {
  WALLET_CONNECTED: 'wallet_connected',
  WALLET_DISCONNECTED: 'wallet_disconnected',
  BET_CREATED: 'bet_created',
  BET_JOINED: 'bet_joined',
  BET_RESOLVED: 'bet_resolved',
} as const;

export const QUERY_KEYS = {
  BETS: 'bets',
  BET: 'bet',
  USER: 'user',
  PROFILE: 'profile',
  TRANSACTIONS: 'transactions',
} as const;

export const PAGE_SIZE = 10;

export const DATETIME_FORMAT = {
  FULL: 'MMM dd, yyyy HH:mm',
  DATE: 'MMM dd, yyyy',
  TIME: 'HH:mm',
} as const;

export const DEFAULT_LOCALE = 'en-US';

export const SUPPORTED_LOCALES = ['en-US', 'ru-RU'] as const;