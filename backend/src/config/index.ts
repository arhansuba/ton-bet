// index.ts
import dotenv from 'dotenv';
import { databaseConfig } from './database';

// Load environment variables
dotenv.config();

interface Config {
  environment: 'development' | 'production' | 'test';
  port: number;
  host: string;
  database: typeof databaseConfig;
  telegram: {
    botToken: string;
    webhookUrl: string;
    adminUserIds: string[];
  };
  ton: {
    network: 'mainnet' | 'testnet';
    endpoint: string;
    apiKey: string;
    mnemonic: string;
    contracts: {
      bet: string;
      paymentChannel: string;
    };
    fees: {
      platform: number; // 5% = 500
      organizer: number; // 5% = 500
      minBet: string; // in nanotons
    };
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
  security: {
    rateLimit: {
      windowMs: number;
      maxRequests: number;
    };
    cors: {
      origin: string[];
      methods: string[];
    };
    webhookSecrets: {
      ton: string;
      telegram: string;
      notification: string;
    };
  };
  cache: {
    ttl: {
      user: number;
      bet: number;
      leaderboard: number;
    }
  };
  features: {
    paymentChannels: boolean;
    subscriptions: boolean;
    organizerBets: boolean;
  };
  monitoring: {
    sentry?: {
      dsn: string;
      environment: string;
    };
    prometheus?: {
      port: number;
    };
  };
}

const config: Config = {
  environment: (process.env.NODE_ENV as Config['environment']) || 'development',
  port: parseInt(process.env.PORT || '3000', 10),
  host: process.env.HOST || '0.0.0.0',
  
  database: databaseConfig,

  telegram: {
    botToken: process.env.TELEGRAM_BOT_TOKEN || '',
    webhookUrl: process.env.TELEGRAM_WEBHOOK_URL || '',
    adminUserIds: (process.env.TELEGRAM_ADMIN_IDS || '').split(',')
  },

  ton: {
    network: (process.env.TON_NETWORK as 'mainnet' | 'testnet') || 'testnet',
    endpoint: process.env.TON_ENDPOINT || 'https://toncenter.com/api/v2/jsonRPC',
    apiKey: process.env.TON_API_KEY || '',
    mnemonic: process.env.TON_WALLET_MNEMONIC || '',
    contracts: {
      bet: process.env.TON_BET_CONTRACT || '',
      paymentChannel: process.env.TON_PAYMENT_CHANNEL_CONTRACT || ''
    },
    fees: {
      platform: 500, // 5%
      organizer: 500, // 5%
      minBet: '100000000' // 0.1 TON in nanotons
    }
  },

  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    password: process.env.REDIS_PASSWORD
  },

  security: {
    rateLimit: {
      windowMs: 15 * 60 * 1000, // 15 minutes
      maxRequests: 100
    },
    cors: {
      origin: (process.env.CORS_ORIGINS || '*').split(','),
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS']
    },
    webhookSecrets: {
      ton: process.env.TON_WEBHOOK_SECRET || '',
      telegram: process.env.TELEGRAM_WEBHOOK_SECRET || '',
      notification: process.env.NOTIFICATION_WEBHOOK_SECRET || ''
    }
  },

  cache: {
    ttl: {
      user: 5 * 60, // 5 minutes
      bet: 1 * 60, // 1 minute
      leaderboard: 15 * 60 // 15 minutes
    }
  },

  features: {
    paymentChannels: process.env.FEATURE_PAYMENT_CHANNELS === 'true',
    subscriptions: process.env.FEATURE_SUBSCRIPTIONS === 'true',
    organizerBets: process.env.FEATURE_ORGANIZER_BETS === 'true'
  },

  monitoring: {
    sentry: process.env.SENTRY_DSN ? {
      dsn: process.env.SENTRY_DSN,
      environment: process.env.NODE_ENV || 'development'
    } : undefined,
    prometheus: process.env.PROMETHEUS_PORT ? {
      port: parseInt(process.env.PROMETHEUS_PORT, 10)
    } : undefined
  }
};

// Validate required configuration
const validateConfig = () => {
  const required = [
    'TELEGRAM_BOT_TOKEN',
    'TON_API_KEY',
    'TON_WALLET_MNEMONIC'
  ];

  for (const key of required) {
    if (!process.env[key]) {
      throw new Error(`Missing required configuration: ${key}`);
    }
  }
};

validateConfig();

export { config };