// types.ts
export interface PaymentChannel {
    id: string;
    userId: string;
    counterpartyAddress: string;
    channelAddress?: string;
    initialBalance: string;
    currentBalanceA: string;
    currentBalanceB: string;
    seqno: number;
    status: ChannelStatus;
    latestSignature?: string;
    createdAt: number;
  }
  
  export enum ChannelStatus {
    PENDING = 'PENDING',
    OPEN = 'OPEN',
    CLOSING = 'CLOSING',
    CLOSED = 'CLOSED'
  }
  
  export interface CreateChannelParams {
    userId: string;
    counterpartyAddress: string;
    initialBalance: string;
  }
  
  export interface UpdateChannelStateParams {
    balanceA: string;
    balanceB: string;
    seqno: number;
    signature: string;
  }
  
  export interface CloseChannelParams {
    finalBalanceA: string;
    finalBalanceB: string;
  }