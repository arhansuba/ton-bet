// Transaction.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface ITransaction extends Document {
  txHash: string;
  blockHash: string;
  logicalTime: string;
  type: 'BET_CREATE' | 'BET_JOIN' | 'BET_RESOLVE' | 'CHANNEL_OPEN' | 'CHANNEL_CLOSE' | 'TRANSFER';
  status: 'PENDING' | 'CONFIRMED' | 'FAILED';
  from: string;
  to: string;
  amount: string;
  data: {
    betId?: string;
    channelId?: string;
    comment?: string;
    operation?: string;
    params?: Record<string, any>;
  };
  fees: {
    gas: string;
    storage: string;
    other: string;
  };
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    deviceId?: string;
    customData?: any;
  };
  processedAt?: number;
  failureReason?: string;
  relatedTxHash?: string;
  createdAt: number;
  updatedAt: number;
}

const TransactionSchema: Schema = new Schema({
  txHash: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  blockHash: {
    type: String,
    required: true,
    index: true
  },
  logicalTime: {
    type: String,
    required: true,
    index: true
  },
  type: {
    type: String,
    enum: ['BET_CREATE', 'BET_JOIN', 'BET_RESOLVE', 'CHANNEL_OPEN', 'CHANNEL_CLOSE', 'TRANSFER'],
    required: true,
    index: true
  },
  status: {
    type: String,
    enum: ['PENDING', 'CONFIRMED', 'FAILED'],
    default: 'PENDING',
    index: true
  },
  from: {
    type: String,
    required: true,
    index: true
  },
  to: {
    type: String,
    required: true,
    index: true
  },
  amount: {
    type: String,
    required: true
  },
  data: {
    betId: {
      type: String,
      sparse: true,
      index: true
    },
    channelId: {
      type: String,
      sparse: true,
      index: true
    },
    comment: String,
    operation: String,
    params: Schema.Types.Mixed
  },
  fees: {
    gas: {
      type: String,
      required: true
    },
    storage: {
      type: String,
      required: true
    },
    other: {
      type: String,
      required: true
    }
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    deviceId: String,
    customData: Schema.Types.Mixed
  },
  processedAt: {
    type: Number,
    sparse: true,
    index: true
  },
  failureReason: {
    type: String,
    sparse: true
  },
  relatedTxHash: {
    type: String,
    sparse: true,
    index: true
  },
  createdAt: {
    type: Number,
    default: () => Date.now(),
    index: true
  },
  updatedAt: {
    type: Number,
    default: () => Date.now()
  }
}, {
  timestamps: { currentTime: () => Date.now() }
});

// Indexes
TransactionSchema.index({ type: 1, status: 1, createdAt: -1 });
TransactionSchema.index({ from: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ to: 1, type: 1, createdAt: -1 });
TransactionSchema.index({ 'data.betId': 1, type: 1 });
TransactionSchema.index({ 'data.channelId': 1, type: 1 });

// Middleware
TransactionSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual getters
TransactionSchema.virtual('totalFees').get(function() {
  return (
    BigInt(this.fees.gas) + 
    BigInt(this.fees.storage) + 
    BigInt(this.fees.other)
  ).toString();
});

TransactionSchema.virtual('age').get(function() {
  return Date.now() - this.createdAt;
});

TransactionSchema.virtual('isProcessed').get(function() {
  return this.status !== 'PENDING';
});

// Methods
TransactionSchema.methods.markConfirmed = async function() {
  this.status = 'CONFIRMED';
  this.processedAt = Date.now();
  await this.save();
};

TransactionSchema.methods.markFailed = async function(reason: string) {
  this.status = 'FAILED';
  this.failureReason = reason;
  this.processedAt = Date.now();
  await this.save();
};

export const Transaction = mongoose.model<ITransaction>('Transaction', TransactionSchema);