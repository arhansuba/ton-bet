// endpoints.ts
import { API_CONFIG } from '../../constants';

const BASE_PATH = process.env.NEXT_PUBLIC_API_URL || 'https://api.tonbet.app';

export const ENDPOINTS = {
  // Bet endpoints
  BETS: '/bets',
  BET_BY_ID: (id: string) => `/bets/${id}`,
  JOIN_BET: (id: string) => `/bets/${id}/join`,
  RESOLVE_BET: (id: string) => `/bets/${id}/resolve`,
  
  // User endpoints
  USER_PROFILE: (address: string) => `/users/${address}`,
  USER_BETS: (address: string) => `/users/${address}/bets`,
  USER_STATS: (address: string) => `/users/${address}/stats`,
  
  // Transaction endpoints
  TRANSACTIONS: '/transactions',
  VERIFY_TRANSACTION: (hash: string) => `/transactions/${hash}/verify`,
  
  // Platform endpoints
  PLATFORM_STATS: '/stats',
} as const;

export const API_CONFIG_BY_ENDPOINT = {
  [ENDPOINTS.BETS]: {
    timeout: API_CONFIG.TIMEOUT,
    retries: API_CONFIG.RETRY_ATTEMPTS,
  },
  '/transactions/:hash/verify': {
    timeout: API_CONFIG.TIMEOUT * 2,
    retries: API_CONFIG.RETRY_ATTEMPTS * 2,
  },
} as const;

export const buildUrl = (endpoint: string, params?: Record<string, string | number>): string => {
  const url = new URL(BASE_PATH + endpoint);
  
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) {
        url.searchParams.append(key, value.toString());
      }
    });
  }
  
  return url.toString();
};