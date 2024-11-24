// testnet.config.ts
import { Address } from '@ton/core';
import { FullConfig } from './types';

export const testnetConfig: FullConfig = {
  environment: 'development',
  
  network: {
    network: 'testnet',
    endpoint: 'https://testnet.toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TESTNET_API_KEY || '',
    trackerEndpoint: 'https://testnet.toncenter.com/api/v2/tracker',
    explorerUrl: 'https://testnet.tonscan.org'
  },

  contracts: {
    bet: {
      code: process.env.TESTNET_BET_CODE || '',
      address: Address.parse(process.env.TESTNET_BET_ADDRESS || ''),
      minAmount: '100000000', // 0.1 TON
      maxAmount: '1000000000000', // 1000 TON
      platformFee: 500, // 5%
      organizerFee: 500 // 5%
    },
    paymentChannel: {
      code: process.env.TESTNET_PAYMENT_CHANNEL_CODE || '',
      minAmount: '100000000', // 0.1 TON
      maxAmount: '100000000000', // 100 TON
      challengePeriod: 24 * 60 * 60 // 24 hours in seconds
    }
  },

  wallet: {
    mnemonic: process.env.TESTNET_WALLET_MNEMONIC || '',
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
    corsOrigins: (process.env.CORS_ORIGINS || '*').split(','),
    jwtSecret: process.env.JWT_SECRET || 'test-secret',
    telegram: {
      botToken: process.env.TELEGRAM_BOT_TOKEN || '',
      webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
      adminIds: (process.env.TELEGRAM_ADMIN_IDS || '').split(',')
    },
    database: {
      url: process.env.MONGODB_URL || 'mongodb://localhost:27017',
      name: 'ton_betting_testnet'
    },
    redis: {
      host: process.env.REDIS_HOST || 'localhost',
      port: parseInt(process.env.REDIS_PORT || '6379', 10),
      password: process.env.REDIS_PASSWORD
    }
  },

  monitoring: {
    sentry: process.env.SENTRY_DSN ? {
      dsn: process.env.SENTRY_DSN,
      environment: 'testnet'
    } : undefined,
    prometheus: {
      port: parseInt(process.env.PROMETHEUS_PORT || '9090', 10),
      metrics: [
        'http_requests_total',
        'http_request_duration_seconds',
        'ton_transactions_total',
        'active_bets',
        'payment_channels_total'
      ]
    }
  }
};