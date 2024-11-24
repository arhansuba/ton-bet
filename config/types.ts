// types.ts
import { Address } from '@ton/core';

export interface NetworkConfig {
  network: 'mainnet' | 'testnet';
  endpoint: string;
  apiKey: string;
  trackerEndpoint: string;
  explorerUrl: string;
}

export interface ContractConfig {
  bet: {
    code: string;
    address: Address;
    minAmount: string;
    maxAmount: string;
    platformFee: number;
    organizerFee: number;
  };
  paymentChannel: {
    code: string;
    minAmount: string;
    maxAmount: string;
    challengePeriod: number;
  };
}

export interface WalletConfig {
  mnemonic: string;
  version: 'v3R2' | 'v4R2';
  workchain: number;
  subwalletId?: number;
}

export interface ExplorerConfig {
  mainnet: {
    url: string;
    apiKey?: string;
  };
  testnet: {
    url: string;
    apiKey?: string;
  };
}

export interface ServiceConfig {
  host: string;
  port: number;
  corsOrigins: string[];
  jwtSecret: string;
  telegram: {
    botToken: string;
    webhookUrl: string;
    adminIds: string[];
  };
  database: {
    url: string;
    name: string;
  };
  redis: {
    host: string;
    port: number;
    password?: string;
  };
}

export interface MonitoringConfig {
  sentry?: {
    dsn: string;
    environment: string;
  };
  prometheus?: {
    port: number;
    metrics: string[];
  };
}

export interface FullConfig {
  environment: 'development' | 'production' | 'test';
  network: NetworkConfig;
  contracts: ContractConfig;
  wallet: WalletConfig;
  explorer: ExplorerConfig;
  service: ServiceConfig;
  monitoring: MonitoringConfig;
}