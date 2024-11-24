// types.ts
export interface Bet {
    id: string;
    creatorId: string;
    amount: string;
    description: string;
    participants: string[];
    expiryTime: number;
    status: BetStatus;
    contractAddress?: string;
    winner?: string;
    createdAt: number;
  }
  
  export enum BetStatus {
    PENDING = 'PENDING',
    ACTIVE = 'ACTIVE',
    RESOLVED = 'RESOLVED',
    EXPIRED = 'EXPIRED'
  }
  
  export interface CreateBetParams {
    creatorId: string;
    amount: string;
    description: string;
    participants: string[];
    expiryTime: number;
  }
  
  export interface BetQuery {
    status?: string;
    userId?: string;
  }
  
  export interface JoinBetParams {
    userId: string;
    userAddress: string;
  }