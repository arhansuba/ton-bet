// telegram.ts
export interface TelegramUser {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
    language_code?: string;
  }
  
  export interface TelegramInitData {
    query_id?: string;
    user: TelegramUser;
    auth_date: number;
    hash: string;
  }
  
  export interface TelegramWebAppInfo {
    initData: TelegramInitData;
    initDataUnsafe: {
      query_id?: string;
      user?: TelegramUser;
      auth_date?: number;
      hash?: string;
      start_param?: string;
    };
  }
  
  export interface TelegramBotCommand {
    command: string;
    description: string;
  }
  
  export interface TelegramKeyboard {
    inline_keyboard?: TelegramInlineButton[][];
    keyboard?: TelegramButton[][];
    resize_keyboard?: boolean;
    one_time_keyboard?: boolean;
    remove_keyboard?: boolean;
  }
  
  export interface TelegramInlineButton {
    text: string;
    callback_data?: string;
    url?: string;
    web_app?: {
      url: string;
    };
  }
  
  export interface TelegramButton {
    text: string;
    request_contact?: boolean;
    request_location?: boolean;
    web_app?: {
      url: string;
    };
  }
  
  export interface TelegramCallbackQuery {
    id: string;
    from: TelegramUser;
    message?: {
      message_id: number;
      chat: {
        id: number;
        type: string;
      };
      date: number;
      text?: string;
    };
    data?: string;
  }
  
  export interface TelegramWebhookUpdate {
    update_id: number;
    message?: {
      message_id: number;
      from: TelegramUser;
      chat: {
        id: number;
        type: string;
        title?: string;
      };
      date: number;
      text?: string;
      entities?: {
        type: string;
        offset: number;
        length: number;
      }[];
    };
    callback_query?: TelegramCallbackQuery;
  }
  
  export interface TelegramNotification {
    type: NotificationType;
    recipientId: string;
    message: string;
    data?: any;
    keyboard?: TelegramKeyboard;
  }
  
  export enum NotificationType {
    BET_CREATED = 'BET_CREATED',
    BET_JOINED = 'BET_JOINED',
    BET_RESOLVED = 'BET_RESOLVED',
    PAYMENT_RECEIVED = 'PAYMENT_RECEIVED',
    CHANNEL_CLOSED = 'CHANNEL_CLOSED',
    ALERT = 'ALERT'
  }
  
  export interface TelegramMenu {
    type: 'main' | 'bet' | 'wallet' | 'settings';
    buttons: TelegramInlineButton[][];
  }
  
  export interface TelegramDeepLink {
    type: 'bet' | 'channel' | 'profile';
    params: Record<string, string>;
  }
  
  export interface TelegramBotConfig {
    commands: TelegramBotCommand[];
    menus: Record<string, TelegramMenu>;
    messages: Record<string, string>;
    callbacks: Record<string, (query: TelegramCallbackQuery) => Promise<void>>;
  }
  
  export interface TelegramMessageTemplate {
    text: string;
    parse_mode?: 'HTML' | 'Markdown';
    keyboard?: TelegramKeyboard;
    disable_web_page_preview?: boolean;
  }
  
  export interface TelegramSessionData {
    userId: string;
    state?: string;
    data?: Record<string, any>;
    lastInteraction: number;
  }
  
  export class TelegramError extends Error {
    constructor(
      message: string,
      public code?: string,
      public telegramErrorCode?: number
    ) {
      super(message);
      this.name = 'TelegramError';
    }
  }