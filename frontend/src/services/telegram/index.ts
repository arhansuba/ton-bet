// index.ts
import { webAppService } from './webapp';
import { Address } from '@ton/core';
import { tonService } from '../ton';

interface SendMessageParams {
  chatId: number;
  text: string;
  parseMode?: 'HTML' | 'Markdown';
  replyToMessageId?: number;
  disableWebPagePreview?: boolean;
}

interface BetNotification {
  betId: string;
  creator: Address;
  amount: string;
  description: string;
}

interface WinnerNotification {
  betId: string;
  winner: Address;
  amount: string;
  description: string;
}

class TelegramService {
  private static instance: TelegramService;
  private groupId?: number;

  constructor() {
    // Group ID can be obtained from WebApp start params
    this.groupId = parseInt(webAppService.getStartParam() || '');
  }

  public static getInstance(): TelegramService {
    if (!TelegramService.instance) {
      TelegramService.instance = new TelegramService();
    }
    return TelegramService.instance;
  }

  private async sendMessage({
    chatId,
    text,
    parseMode = 'HTML',
    replyToMessageId,
    disableWebPagePreview = false
  }: SendMessageParams) {
    const params = new URLSearchParams({
      chat_id: chatId.toString(),
      text,
      parse_mode: parseMode,
      disable_web_page_preview: disableWebPagePreview.toString(),
    });

    if (replyToMessageId) {
      params.append('reply_to_message_id', replyToMessageId.toString());
    }

    const response = await fetch(`/api/telegram/sendMessage?${params.toString()}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to send Telegram message');
    }

    return response.json();
  }

  public async notifyNewBet({
    betId,
    creator,
    amount,
    description
  }: BetNotification) {
    if (!this.groupId) return;

    const message = `🎲 <b>New Bet Created!</b>\n\n` +
      `💰 Amount: ${amount} TON\n` +
      `📝 Description: ${description}\n` +
      `👤 Creator: <code>${creator.toString()}</code>\n\n` +
      `🔗 <a href="https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/bet_${betId}">Join Bet</a>`;

    return this.sendMessage({
      chatId: this.groupId,
      text: message,
      parseMode: 'HTML'
    });
  }

  public async notifyBetJoined({
    betId,
    creator,
    amount,
    description
  }: BetNotification) {
    if (!this.groupId) return;

    const message = `✅ <b>Bet Joined!</b>\n\n` +
      `💰 Amount: ${amount} TON\n` +
      `📝 Description: ${description}\n` +
      `👤 Creator: <code>${creator.toString()}</code>\n\n` +
      `👀 <a href="https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/bet_${betId}">View Bet</a>`;

    return this.sendMessage({
      chatId: this.groupId,
      text: message,
      parseMode: 'HTML'
    });
  }

  public async notifyBetResolved({
    betId,
    winner,
    amount,
    description
  }: WinnerNotification) {
    if (!this.groupId) return;

    const message = `🏆 <b>Bet Resolved!</b>\n\n` +
      `💰 Prize: ${amount} TON\n` +
      `📝 Description: ${description}\n` +
      `🥇 Winner: <code>${winner.toString()}</code>\n\n` +
      `👀 <a href="https://t.me/${process.env.NEXT_PUBLIC_BOT_USERNAME}/bet_${betId}">View Bet</a>`;

    return this.sendMessage({
      chatId: this.groupId,
      text: message,
      parseMode: 'HTML'
    });
  }

  public async notifyBetCancelled({
    betId,
    creator,
    amount,
    description
  }: BetNotification) {
    if (!this.groupId) return;

    const message = `❌ <b>Bet Cancelled!</b>\n\n` +
      `💰 Amount: ${amount} TON\n` +
      `📝 Description: ${description}\n` +
      `👤 Creator: <code>${creator.toString()}</code>`;

    return this.sendMessage({
      chatId: this.groupId,
      text: message,
      parseMode: 'HTML'
    });
  }

  public getUserData() {
    return webAppService.getUserData();
  }

  public async showConfirmBet(amount: string): Promise<boolean> {
    const confirmed = await webAppService.showConfirm(
      `Are you sure you want to create a bet for ${amount} TON?`
    );
    if (confirmed) {
      webAppService.hapticNotification('success');
    }
    return confirmed;
  }

  public showMainButton(text: string, onClick: () => void, isLoading = false) {
    webAppService.configureMainButton({
      text,
      onClick,
      isLoading
    });
  }

  public hideMainButton() {
    webAppService.hideMainButton();
  }
}

export const telegramService = TelegramService.getInstance();