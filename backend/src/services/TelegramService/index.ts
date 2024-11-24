// index.ts
import { Telegraf, Context } from 'telegraf';
import { Message } from 'typegram';
import { TelegramNotification, NotificationType, ChatConfig, BetNotificationData, ButtonAction } from './types';
import { DatabaseService } from '../DatabaseService';
import { logger } from '../../utils/logger';
import { config } from '../../config';

export class TelegramService {
  private bot: Telegraf;

  constructor(
    private db: DatabaseService,
    private botToken: string = config.telegram.botToken
  ) {
    this.bot = new Telegraf(this.botToken);
    this.setupBot();
  }

  private setupBot(): void {
    this.bot.command('start', this.handleStart.bind(this));
    this.bot.command('help', this.handleHelp.bind(this));
    this.bot.launch().catch(err => logger.error('Failed to launch bot:', err));
  }

  private async handleStart(ctx: Context): Promise<void> {
    try {
      const welcomeMessage = `Welcome to TON Betting Bot! 🎲\n\n` +
        `Here you can create and participate in bets using TON.\n` +
        `Use /help to see available commands.`;
      
      await ctx.reply(welcomeMessage, {
        reply_markup: {
          keyboard: [
            ['🎲 Create Bet', '📊 My Bets'],
            ['👛 Wallet', '🏆 Leaderboard']
          ],
          resize_keyboard: true
        }
      });
    } catch (error) {
      logger.error('Error in start handler:', error);
    }
  }

  private async handleHelp(ctx: Context): Promise<void> {
    try {
      const helpMessage = `Available commands:\n\n` +
        `/createbet - Create a new bet\n` +
        `/mybets - View your active bets\n` +
        `/wallet - Connect your TON wallet\n` +
        `/leaderboard - View top winners`;
      
      await ctx.reply(helpMessage);
    } catch (error) {
      logger.error('Error in help handler:', error);
    }
  }

  async sendNotification(userId: string, notification: TelegramNotification): Promise<void> {
    try {
      const message = this.formatNotification(notification);
      const buttons = this.getNotificationButtons(notification);

      await this.bot.telegram.sendMessage(userId, message, {
        parse_mode: 'HTML',
        ...this.createInlineKeyboard(buttons)
      });
    } catch (error) {
      logger.error(`Error sending notification to user ${userId}:`, error);
    }
  }

  private formatNotification(notification: TelegramNotification): string {
    switch (notification.type) {
      case NotificationType.BET_CREATED:
        const betData = notification.data as BetNotificationData;
        return `🎲 New Bet Created!\n\n` +
          `Amount: ${betData.amount} TON\n` +
          `Description: ${betData.description}\n` +
          `Contract: ${betData.contractAddress}`;
      
      case NotificationType.BET_JOINED:
        return `👥 New participant joined your bet!\n\n` +
          `Bet: ${notification.data.description}\n` +
          `Participant: ${notification.data.participant}`;
      
      case NotificationType.BET_RESOLVED:
        return `🏆 Bet Resolved!\n\n` +
          `Winner: ${notification.data.winner}\n` +
          `Amount Won: ${notification.data.amount} TON`;
      
      default:
        return notification.data.message || 'New notification';
    }
  }

  private createInlineKeyboard(buttons: ButtonAction[]): any {
    if (!buttons.length) return {};

    return {
      reply_markup: {
        inline_keyboard: buttons.map(button => [{
          text: button.text,
          callback_data: JSON.stringify({
            action: button.callback,
            ...button.data
          })
        }])
      }
    };
  }

  private getNotificationButtons(notification: TelegramNotification): ButtonAction[] {
    switch (notification.type) {
      case NotificationType.BET_CREATED:
        return [{
          text: '🔍 View Details',
          callback: 'view_bet',
          data: { betId: notification.data.betId }
        }, {
          text: '➡️ Join Bet',
          callback: 'join_bet',
          data: { betId: notification.data.betId }
        }];
      
      case NotificationType.BET_RESOLVED:
        return [{
          text: '🔍 View Details',
          callback: 'view_bet',
          data: { betId: notification.data.betId }
        }];
      
      default:
        return [];
    }
  }

  async initializeGroupChat(chatId: string, userIds: string[]): Promise<void> {
    try {
      const chatConfig: ChatConfig = {
        chatId,
        userIds,
        settings: {
          notifications: true,
          language: 'en',
          timezone: 'UTC'
        }
      };

      await this.db.chatConfigs.insertOne(chatConfig);

      const welcomeMessage = `🎲 TON Betting group chat initialized!\n\n` +
        `Users can now create and participate in bets together.`;
      
      await this.bot.telegram.sendMessage(chatId, welcomeMessage);
    } catch (error) {
      logger.error(`Error initializing group chat ${chatId}:`, error);
    }
  }

  async notifyBetCreated(bet: any, contractAddress: string): Promise<void> {
    const notification: TelegramNotification = {
      type: NotificationType.BET_CREATED,
      data: {
        betId: bet.id,
        amount: bet.amount,
        description: bet.description,
        contractAddress
      },
      timestamp: Date.now()
    };

    await this.sendNotification(bet.creatorId, notification);
  }

  async notifyBetJoined(bet: any): Promise<void> {
    const notification: TelegramNotification = {
      type: NotificationType.BET_JOINED,
      data: {
        betId: bet.id,
        description: bet.description,
        participants: bet.participants
      },
      timestamp: Date.now()
    };

    await this.sendNotification(bet.creatorId, notification);
  }

  async notifyBetResolved(bet: any): Promise<void> {
    const notification: TelegramNotification = {
      type: NotificationType.BET_RESOLVED,
      data: {
        betId: bet.id,
        description: bet.description,
        winner: bet.winner,
        amount: bet.amount
      },
      timestamp: Date.now()
    };

    // Notify all participants
    const allUsers = [bet.creatorId, ...bet.participants];
    await Promise.all(
      allUsers.map(userId => this.sendNotification(userId, notification))
    );
  }

  async notifyChannelClosed(channelId: string): Promise<void> {
    const channel = await this.db.channels.findOne({ id: channelId });
    if (!channel) return;

    const notification: TelegramNotification = {
      type: NotificationType.CHANNEL_CLOSED,
      data: {
        channelId,
        finalBalanceA: channel.currentBalanceA,
        finalBalanceB: channel.currentBalanceB
      },
      timestamp: Date.now()
    };

    await this.sendNotification(channel.userId, notification);
  }
}