// mainnet.config.ts
import { Address } from '@ton/core';
import { FullConfig } from './types';

export const mainnetConfig: FullConfig = {
  environment: 'production',
  
  network: {
    network: 'mainnet',
    endpoint: 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.MAINNET_API_KEY || '',
    trackerEndpoint: 'https://toncenter.com/api/v2/tracker',
    explorerUrl: 'https://tonscan.org'
  },

  contracts: {
    bet: {
      code: process.env.MAINNET_BET_CODE || '',
      address: Address.parse(process.env.MAINNET_BET_ADDRESS || ''),
      minAmount: '1000000000', // 1 TON
      maxAmount: '10000000000000', // 10000 TON
      platformFee: 500, // 5%
      organizerFee: 500 // 5%
    },
    paymentChannel: {
      code: process.env.MAINNET_PAYMENT_CHANNEL_CODE || '',
      minAmount: '1000000000', // 1 TON
      maxAmount: '1000000000000', // 1000 TON
      challengePeriod: 24 * 60 * 60 // 24 hours in seconds
    }
  },

  wallet: {
    mnemonic: process.env.MAINNET_WALLET_MNEMONIC || '',
    version: 'v4R2',
    workchain: 0
  },

  explorer: {
    mainnet: {
      url: 'https://tonscan.org',
      apiKey: process.env.TONSCAN_API_KEY
    },
    testnet: {
      url: 'https://testnet.tonscan.org',
      apiKey: process.env.TONSCAN_TESTNET_API_KEY
    }
  },

  service: {
    host: process.env.HOST || '0.0.0.0',
    port: parseInt(process.env.PORT || '3000', 10),
    corsOrigins: ['https://t.me'], // More restrictive CORS for production
    jwtSecret: process.env.JWT_SECRET || '',
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
      adminIds: (process.env.TELEGRAM_ADMIN_IDS || '').split(',')
    },
    database: {
      url: process.env.MONGODB_URL || '',
      name: 'ton_betting_mainnet'
    },
    redis: {
      host: process.env.REDIS_HOST || '',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD
    }
  },

  monitoring: {
    sentry: {
      dsn: process.env.SENTRY_DSN || '',
      environment: 'mainnet'
    },
    prometheus: {
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
      metrics: [
        'http_requests_total',
        'http_request_duration_seconds',
        'ton_transactions_total',
        'active_bets',
        'payment_channels_total',
        'wallet_balance',
        'bet_volume_total',
        'user_count',
        'error_count'
      ]
    }
  }
};

// Validate required mainnet configuration
const validateMainnetConfig = () => {
  const required = [
    'MAINNET_API_KEY',
    'MAINNET_WALLET_MNEMONIC',
    'MAINNET_BET_CODE',
    'MAINNET_BET_ADDRESS',
    'JWT_SECRET',
    'TELEGRAM_BOT_TOKEN',
    'MONGODB_URL',
    'REDIS_PASSWORD',
    'SENTRY_DSN'
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required mainnet configuration: ${key}`);
    }
  }

  // Additional validations
  if (mainnetConfig.wallet.mnemonic.split(' ').length !== 24) {
    throw new Error('Invalid wallet mnemonic length');
  }

  if (mainnetConfig.service.jwtSecret.length < 32) {
    throw new Error('JWT secret must be at least 32 characters long');
  }
};

// Only validate in production
if (process.env.NODE_ENV === 'production') {
  validateMainnetConfig();
}