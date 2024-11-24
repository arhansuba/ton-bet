// database.ts
import mongoose from 'mongoose';
import { logger } from './logger';
import { config } from '../config';

interface ConnectionOptions extends mongoose.ConnectOptions {
  maxPoolSize: number;
  minPoolSize: number;
  connectTimeoutMS: number;
}

class Database {
  private static instance: Database;
  private isConnected: boolean = false;

  private constructor() {
    this.connect();
  }

  public static getInstance(): Database {
    if (!Database.instance) {
      Database.instance = new Database();
    }
    return Database.instance;
  }

  private async connect(): Promise<void> {
    if (this.isConnected) {
      return;
    }

    const options: ConnectionOptions = {
      maxPoolSize: 10,
      minPoolSize: 2,
      connectTimeoutMS: 10000,
      socketTimeoutMS: 45000,
      family: 4
    };

    try {
      mongoose.connection.on('connected', () => {
        logger.info('MongoDB connected successfully');
        this.isConnected = true;
      });

      mongoose.connection.on('error', (err) => {
        logger.error('MongoDB connection error:', err);
        this.isConnected = false;
      });

      mongoose.connection.on('disconnected', () => {
        logger.warn('MongoDB disconnected');
        this.isConnected = false;
      });

      process.on('SIGINT', async () => {
        await mongoose.connection.close();
        logger.info('MongoDB connection closed through app termination');
        process.exit(0);
      });

      await mongoose.connect(config.database.url, options);
    } catch (error) {
      logger.error('Error connecting to MongoDB:', error);
      throw error;
    }
  }

  public async disconnect(): Promise<void> {
    if (this.isConnected) {
      await mongoose.connection.close();
      this.isConnected = false;
      logger.info('MongoDB disconnected');
    }
  }

  public async healthCheck(): Promise<boolean> {
    try {
      const state = mongoose.connection.readyState;
      return state === 1; // 1 = connected
    } catch (error) {
      logger.error('Database health check failed:', error);
      return false;
    }
  }

  public async clearCollections(): Promise<void> {
    if (config.environment !== 'test') {
      throw new Error('Clear collections only allowed in test environment');
    }

    const collections = mongoose.connection.collections;
    for (const key in collections) {
      await collections[key].deleteMany({});
    }
  }

  public async createIndexes(): Promise<void> {
    try {
      const collections = mongoose.connection.collections;
      for (const key in collections) {
        await collections[key].createIndexes();
      }
      logger.info('Database indexes created successfully');
    } catch (error) {
      logger.error('Error creating database indexes:', error);
      throw error;
    }
  }

  public async backup(): Promise<void> {
    // Implement backup logic
    throw new Error('Not implemented');
  }
}

export const db = Database.getInstance();