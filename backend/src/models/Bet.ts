// Bet.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IBet extends Document {
  creatorId: string;
  description: string;
  amount: string;
  participants: string[];
  status: 'PENDING' | 'ACTIVE' | 'RESOLVED' | 'EXPIRED';
  winner?: string;
  contractAddress?: string;
  groupId?: string;
  expiryTime: number;
  platform_fee: string;
  organizer_fee: string;
  betType: 'FRIEND' | 'BIG';
  metadata: {
    category?: string;
    tags?: string[];
    customData?: any;
  };
  transactions: {
    txHash: string;
    type: 'CREATE' | 'JOIN' | 'RESOLVE';
    from: string;
    amount: string;
    timestamp: number;
  }[];
  createdAt: number;
  updatedAt: number;
}

const BetSchema: Schema = new Schema({
  creatorId: {
    type: String,
    required: true,
    index: true
  },
  description: {
    type: String,
    required: true
  },
  amount: {
    type: String,
    required: true
  },
  participants: {
    type: [String],
    default: []
  },
  status: {
    type: String,
    enum: ['PENDING', 'ACTIVE', 'RESOLVED', 'EXPIRED'],
    default: 'PENDING',
    index: true
  },
  winner: {
    type: String,
    sparse: true
  },
  contractAddress: {
    type: String,
    sparse: true,
    unique: true
  },
  groupId: {
    type: String,
    sparse: true,
    index: true
  },
  expiryTime: {
    type: Number,
    required: true,
    index: true
  },
  platform_fee: {
    type: String,
    default: '0'
  },
  organizer_fee: {
    type: String,
    default: '0'
  },
  betType: {
    type: String,
    enum: ['FRIEND', 'BIG'],
    default: 'FRIEND',
    index: true
  },
  metadata: {
    category: {
      type: String,
      sparse: true,
      index: true
    },
    tags: {
      type: [String],
      default: []
    },
    customData: {
      type: Schema.Types.Mixed
    }
  },
  transactions: [{
    txHash: {
      type: String,
      required: true
    },
    type: {
      type: String,
      enum: ['CREATE', 'JOIN', 'RESOLVE'],
      required: true
    },
    from: {
      type: String,
      required: true
    },
    amount: {
      type: String,
      required: true
    },
    timestamp: {
      type: Number,
      required: true
    }
  }],
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
BetSchema.index({ status: 1, expiryTime: 1 });
BetSchema.index({ creatorId: 1, status: 1 });
BetSchema.index({ betType: 1, status: 1 });
BetSchema.index({ 'metadata.category': 1, status: 1 });

// Middleware
BetSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Virtual getters
BetSchema.virtual('isExpired').get(function() {
  return Date.now() > this.expiryTime;
});

BetSchema.virtual('totalAmount').get(function() {
  return this.transactions.reduce((sum, tx) => {
    if (tx.type === 'CREATE' || tx.type === 'JOIN') {
      return (BigInt(sum) + BigInt(tx.amount)).toString();
    }
    return sum;
  }, '0');
});

export const Bet = mongoose.model<IBet>('Bet', BetSchema);