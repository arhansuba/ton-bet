// database.ts
interface DatabaseConfig {
    url: string;
    options: {
      maxPoolSize: number;
      minPoolSize: number;
      connectTimeoutMS: number;
      socketTimeoutMS: number;
      serverSelectionTimeoutMS: number;
      heartbeatFrequencyMS: number;
      retryWrites: boolean;
      writeConcern: {
        w: number | 'majority';
        j: boolean;
      };
      readPreference: string;
      readConcern: {
        level: string;
      };
    };
    backup: {
      enabled: boolean;
      schedule: string;
      retention: number;
      path: string;
    };
    migrations: {
      enabled: boolean;
      directory: string;
      collection: string;
    };
  }
  
  export const databaseConfig: DatabaseConfig = {
    url: process.env.MONGODB_URL || 'mongodb://localhost:27017/ton_betting',
    options: {
      maxPoolSize: parseInt(process.env.DB_MAX_POOL_SIZE || '10', 10),
      minPoolSize: parseInt(process.env.DB_MIN_POOL_SIZE || '2', 10),
      connectTimeoutMS: parseInt(process.env.DB_CONNECT_TIMEOUT || '10000', 10),
      socketTimeoutMS: parseInt(process.env.DB_SOCKET_TIMEOUT || '45000', 10),
      serverSelectionTimeoutMS: parseInt(process.env.DB_SERVER_SELECTION_TIMEOUT || '30000', 10),
      heartbeatFrequencyMS: parseInt(process.env.DB_HEARTBEAT_FREQUENCY || '10000', 10),
      retryWrites: true,
      writeConcern: {
        w: process.env.NODE_ENV === 'production' ? 'majority' : 1,
        j: true
      },
      readPreference: process.env.NODE_ENV === 'production' ? 'secondaryPreferred' : 'primary',
      readConcern: {
        level: process.env.NODE_ENV === 'production' ? 'majority' : 'local'
      }
    },
    backup: {
      enabled: process.env.DB_BACKUP_ENABLED === 'true',
      schedule: process.env.DB_BACKUP_SCHEDULE || '0 0 * * *', // Daily at midnight
      retention: parseInt(process.env.DB_BACKUP_RETENTION || '7', 10), // Keep backups for 7 days
      path: process.env.DB_BACKUP_PATH || './backups'
    },
    migrations: {
      enabled: process.env.DB_MIGRATIONS_ENABLED === 'true',
      directory: process.env.DB_MIGRATIONS_DIR || './migrations',
      collection: process.env.DB_MIGRATIONS_COLLECTION || 'migrations'
    }
  };
  
  // Validation function for database config
  export const validateDatabaseConfig = () => {
    const { url, options } = databaseConfig;
  
    if (!url) {
      throw new Error('Database URL is required');
    }
  
    if (options.maxPoolSize < options.minPoolSize) {
      throw new Error('maxPoolSize must be greater than or equal to minPoolSize');
    }
  
    if (options.connectTimeoutMS < 1000) {
      throw new Error('connectTimeoutMS must be at least 1000ms');
    }
  
    // Add more validation as needed
  };
  
  // Environment-specific configurations
  if (process.env.NODE_ENV === 'production') {
    // Production-specific overrides
    databaseConfig.options.maxPoolSize = 50;
    databaseConfig.options.minPoolSize = 10;
    databaseConfig.backup.enabled = true;
  } else if (process.env.NODE_ENV === 'test') {
    // Test-specific overrides
    databaseConfig.options.maxPoolSize = 5;
    databaseConfig.options.minPoolSize = 1;
    databaseConfig.backup.enabled = false;
  }
  
  // Export utility function to get connection string with options
  export const getConnectionString = () => {
    const { url } = databaseConfig;
    const params = new URLSearchParams({
      retryWrites: databaseConfig.options.retryWrites.toString(),
      w: databaseConfig.options.writeConcern.w.toString(),
      readPreference: databaseConfig.options.readPreference,
      maxPoolSize: databaseConfig.options.maxPoolSize.toString()
    });
  
    return `${url}?${params.toString()}`;
  };