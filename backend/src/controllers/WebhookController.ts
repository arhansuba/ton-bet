import { Request, Response } from 'express';
import { TonService } from '../services/TonService';
import { BetService } from '../services/BetService';
import { PaymentService } from '../services/PaymentService';
import { TelegramService } from '../services/TelegramService';
import { logger } from '../utils/logger';
import { Address } from '@ton/core';

export class WebhookController {
  constructor(
    private tonService: TonService,
    private betService: BetService,
    private paymentService: PaymentService,
    private telegramService: TelegramService
  ) {}

  async handleTonEvents = async (req: Request, res: Response) => {
    try {
      const { eventType, data } = req.body;
      
      switch (eventType) {
        case 'betJoined': {
          const { contractAddress, participant } = data;
          const bet = await this.betService.findBetByAddress(contractAddress);
          
          if (bet) {
            await this.betService.confirmParticipantJoined(bet.id, participant);
            await this.telegramService.notifyParticipantJoined(bet.id, participant);
          }
          break;
        }
        
        case 'betResolved': {
          const { contractAddress, winner } = data;
          const bet = await this.betService.findBetByAddress(contractAddress);
          
          if (bet) {
            await this.betService.confirmBetResolution(bet.id, winner);
            await this.telegramService.notifyBetWinner(bet.id, winner);
          }
          break;
        }
        
        case 'channelClosed': {
          const { channelAddress, finalState } = data;
          const channel = await this.paymentService.findChannelByAddress(channelAddress);
          
          if (channel) {
            await this.paymentService.finalizeChannelClosure(channel.id, finalState);
            await this.telegramService.notifyChannelClosed(channel.id);
          }
          break;
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling TON event:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process TON event'
      });
    }
  }

  async handleTelegramEvents = async (req: Request, res: Response) => {
    try {
      const { eventType, data } = req.body;

      switch (eventType) {
        case 'newGroupChat': {
          const { chatId, userIds } = data;
          await this.telegramService.initializeGroupChat(chatId, userIds);
          break;
        }
        
        case 'userLeft': {
          const { chatId, userId } = data;
          await this.betService.handleUserLeft(chatId, userId);
          break;
        }
      }

      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error handling Telegram event:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to process Telegram event'
      });
    }
  }

  async handleNotification = async (req: Request, res: Response) => {
    try {
      const { userId, type, data } = req.body;

      await this.telegramService.sendNotification(userId, {
        type,
        data,
        timestamp: Date.now()
      });

      return res.status(200).json({ success: true });
    } catch (error) {
      logger.error('Error sending notification:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to send notification'
      });
    }
  }
}