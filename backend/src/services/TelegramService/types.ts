// types.ts
export interface TelegramNotification {
    type: NotificationType;
    data: any;
    timestamp: number;
  }
  
  export enum NotificationType {
    BET_CREATED = 'BET_CREATED',
    BET_JOINED = 'BET_JOINED',
    BET_RESOLVED = 'BET_RESOLVED',
    CHANNEL_CLOSED = 'CHANNEL_CLOSED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    ALERT = 'ALERT'
  }
  
  export interface ChatConfig {
    chatId: string;
    userIds: string[];
    settings: {
      notifications: boolean;
      language: string;
      timezone: string;
    };
  }
  
  export interface BetNotificationData {
    betId: string;
    amount: string;
    description: string;
    participants?: string[];
    winner?: string;
    contractAddress?: string;
  }
  
  export interface ButtonAction {
    text: string;
    callback: string;
    data?: Record<string, any>;
  }