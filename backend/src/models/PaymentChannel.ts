// PaymentChannel.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IPaymentChannel extends Document {
  userId: string;
  counterpartyId: string;
  channelAddress: string;
  initialBalance: string;
  currentBalanceA: string;
  currentBalanceB: string;
  seqno: number;
  status: 'PENDING' | 'OPEN' | 'CLOSING' | 'CLOSED';
  lastSignature?: string;
  challengePeriod: number;
  channelConfig: {
    timelock: number;
    minTxAmount: string;
    maxTotal: string;
  };
  metadata: {
    purpose: string;
    customData?: any;
  };
  closeRequest?: {
    requestedBy: string;
    timestamp: number;
    finalStateHash: string;
  };
  disputes: {
    initiator: string;
    timestamp: number;
    disputedStateHash: string;
    resolution?: string;
    resolvedAt?: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

const PaymentChannelSchema: Schema = new Schema({
  userId: {
    type: String,
    required: true,
    index: true
  },
  counterpartyId: {
    type: String,
    required: true,
    index: true
  },
  channelAddress: {
    type: String,
    required: true,
    unique: true
  },
  initialBalance: {
    type: String,
    required: true
  },
  currentBalanceA: {
    type: String,
    required: true
  },
  currentBalanceB: {
    type: String,
    required: true
  },
  seqno: {
    type: Number,
    default: 0
  },
  status: {
    type: String,
    enum: ['PENDING', 'OPEN', 'CLOSING', 'CLOSED'],
    default: 'PENDING',
    index: true
  },
  lastSignature: {
    type: String,
    sparse: true
  },
  challengePeriod: {
    type: Number,
    required: true,
    default: 24 * 60 * 60 // 24 hours in seconds
  },
  channelConfig: {
    timelock: {
      type: Number,
      required: true,
      default: 7 * 24 * 60 * 60 // 1 week in seconds
    },
    minTxAmount: {
      type: String,
      required: true,
      default: '100000000' // 0.1 TON in nanotons
    },
    maxTotal: {
      type: String,
      required: true
    }
  },
  metadata: {
    purpose: {
      type: String,
      required: true
    },
    customData: Schema.Types.Mixed
  },
  closeRequest: {
    requestedBy: String,
    timestamp: Number,
    finalStateHash: String
  },
  disputes: [{
    initiator: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    },
    disputedStateHash: {
      type: String,
      required: true
    },
    resolution: String,
    resolvedAt: Number
  }],
  createdAt: {
    type: Number,
    default: () => Date.now()
  },
  updatedAt: {
    type: Number,
    default: () => Date.now()
  }
}, {
  timestamps: { currentTime: () => Date.now() }
});

// Indexes
PaymentChannelSchema.index({ userId: 1, status: 1 });
PaymentChannelSchema.index({ counterpartyId: 1, status: 1 });
PaymentChannelSchema.index({ status: 1, 'closeRequest.timestamp': 1 });

// Middleware
PaymentChannelSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual getters
PaymentChannelSchema.virtual('isExpired').get(function() {
  return Date.now() > this.channelConfig.timelock + this.createdAt;
});

PaymentChannelSchema.virtual('canChallenge').get(function() {
  if (!this.closeRequest) return false;
  return Date.now() <= this.closeRequest.timestamp + this.challengePeriod;
});

PaymentChannelSchema.virtual('totalTransacted').get(function() {
  return (BigInt(this.initialBalance) - BigInt(this.currentBalanceA)).toString();
});

export const PaymentChannel = mongoose.model<IPaymentChannel>('PaymentChannel', PaymentChannelSchema);