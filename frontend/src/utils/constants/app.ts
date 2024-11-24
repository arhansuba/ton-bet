// app.ts
import { WebAppModeType } from '@telegram-apps/sdk';

export const APP_CONFIG = {
  NAME: 'TON Betting Platform',
  VERSION: '1.0.0',
  DESCRIPTION: 'P2P betting platform on TON blockchain',
} as const;

export const THEME = {
  COLORS: {
    primary: '#0088CC',
    secondary: '#31B545',
    error: '#FF3B30',
    warning: '#FF9500',
    success: '#34C759',
    background: {
      light: '#FFFFFF',
      dark: '#1C1C1E',
    },
    text: {
      light: '#000000',
      dark: '#FFFFFF',
    },
  },
  SPACING: {
    xs: '4px',
    sm: '8px',
    md: '16px',
    lg: '24px',
    xl: '32px',
  },
  BORDER_RADIUS: {
    sm: '8px',
    md: '12px',
    lg: '16px',
    full: '9999px',
  },
} as const;

export const ROUTES = {
  HOME: '/',
  CREATE_BET: '/create',
  BET_DETAILS: '/bet/:id',
  PROFILE: '/profile',
} as const;

export const TELEGRAM = {
  ALLOWED_ATTACH_MENU_MODES: [
    WebAppModeType.FULLSCREEN,
    WebAppModeType.EXPANDED,
  ],
  MIN_HEIGHT: 600,
} as const;

export const API_CONFIG = {
  TIMEOUT: 10000,
  RETRY_ATTEMPTS: 3,
  RETRY_DELAY: 1000,
} as const;

export const CACHE_KEYS = {
  USER_BETS: 'user-bets',
  ACTIVE_BETS: 'active-bets',
  WALLET_INFO: 'wallet-info',
} as const;

export const ANIMATIONS = {
  DURATION: {
    fast: 200,
    normal: 300,
    slow: 500,
  },
  EASING: {
    easeInOut: 'cubic-bezier(0.4, 0, 0.2, 1)',
    easeOut: 'cubic-bezier(0.0, 0, 0.2, 1)',
    easeIn: 'cubic-bezier(0.4, 0, 1, 1)',
  },
} as const;