// User.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  telegramId: string;
  username?: string;
  firstName?: string;
  lastName?: string;
  walletAddress?: string;
  isVerified: boolean;
  stats: {
    totalBets: number;
    wonBets: number;
    totalWagered: string;
    totalWon: string;
    totalLost: string;
    lastBetTime?: number;
  };
  preferences: {
    notifications: {
      betCreated: boolean;
      betJoined: boolean;
      betResolved: boolean;
      paymentReceived: boolean;
    };
    timezone: string;
    language: string;
  };
  achievements: {
    id: string;
    name: string;
    description: string;
    earnedAt: number;
  }[];
  status: 'ACTIVE' | 'SUSPENDED' | 'RESTRICTED';
  roles: ('USER' | 'ADMIN' | 'ORGANIZER')[];
  lastActive: number;
  createdAt: number;
  updatedAt: number;
}

const UserSchema: Schema = new Schema({
  telegramId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  username: {
    type: String,
    sparse: true
  },
  firstName: String,
  lastName: String,
  walletAddress: {
    type: String,
    sparse: true,
    unique: true
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  stats: {
    totalBets: {
      type: Number,
      default: 0
    },
    wonBets: {
      type: Number,
      default: 0
    },
    totalWagered: {
      type: String,
      default: '0'
    },
    totalWon: {
      type: String,
      default: '0'
    },
    totalLost: {
      type: String,
      default: '0'
    },
    lastBetTime: {
      type: Number,
      sparse: true
    }
  },
  preferences: {
    notifications: {
      betCreated: {
        type: Boolean,
        default: true
      },
      betJoined: {
        type: Boolean,
        default: true
      },
      betResolved: {
        type: Boolean,
        default: true
      },
      paymentReceived: {
        type: Boolean,
        default: true
      }
    },
    timezone: {
      type: String,
      default: 'UTC'
    },
    language: {
      type: String,
      default: 'en'
    }
  },
  achievements: [{
    id: {
      type: String,
      required: true
    },
    name: {
      type: String,
      required: true
    },
    description: {
      type: String,
      required: true
    },
    earnedAt: {
      type: Number,
      required: true
    }
  }],
  status: {
    type: String,
    enum: ['ACTIVE', 'SUSPENDED', 'RESTRICTED'],
    default: 'ACTIVE',
    index: true
  },
  roles: {
    type: [String],
    enum: ['USER', 'ADMIN', 'ORGANIZER'],
    default: ['USER']
  },
  lastActive: {
    type: Number,
    default: () => Date.now(),
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
UserSchema.index({ status: 1, roles: 1 });
UserSchema.index({ 'stats.totalBets': -1 });
UserSchema.index({ 'stats.totalWon': -1 });

// Middleware
UserSchema.pre('save', function(next) {
  this.updatedAt = Date.now();
  next();
});

// Methods
UserSchema.methods.updateStats = async function(betResult: {
  won: boolean;
  amount: string;
  wagered: string;
}) {
  this.stats.totalBets += 1;
  this.stats.lastBetTime = Date.now();
  this.stats.totalWagered = (BigInt(this.stats.totalWagered) + BigInt(betResult.wagered)).toString();

  if (betResult.won) {
    this.stats.wonBets += 1;
    this.stats.totalWon = (BigInt(this.stats.totalWon) + BigInt(betResult.amount)).toString();
  } else {
    this.stats.totalLost = (BigInt(this.stats.totalLost) + BigInt(betResult.amount)).toString();
  }

  await this.save();
};

// Virtual getters
UserSchema.virtual('winRate').get(function() {
  return this.stats.totalBets > 0 
    ? (this.stats.wonBets / this.stats.totalBets) * 100 
    : 0;
});

UserSchema.virtual('displayName').get(function() {
  return this.username || this.firstName || this.telegramId;
});

export const User = mongoose.model<IUser>('User', UserSchema);