import { Request, Response } from 'express';
import { PaymentService } from '../services/PaymentService';
import { TonService } from '../services/TonService';
import { validateTelegramInitData } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Address } from '@ton/core';

export class PaymentController {
  constructor(
    private paymentService: PaymentService,
    private tonService: TonService
  ) {}

  async createPaymentChannel = async (req: Request, res: Response) => {
    try {
      const { counterpartyAddress, initialBalance } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const channel = await this.paymentService.createChannel({
        userId: initData.user.id,
        counterpartyAddress,
        initialBalance
      });

      const channelAddress = await this.tonService.deployPaymentChannel(
        channel,
        Address.parse(counterpartyAddress)
      );

      return res.status(201).json({
        success: true,
        channel: { ...channel, channelAddress }
      });
    } catch (error) {
      logger.error('Error creating payment channel:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create payment channel'
      });
    }
  }

  async signState = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { balanceA, balanceB, seqno } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const channel = await this.paymentService.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ success: false, error: 'Channel not found' });
      }

      const signedState = await this.tonService.signChannelState({
        channelAddress: Address.parse(channel.channelAddress),
        balanceA,
        balanceB,
        seqno
      });

      await this.paymentService.updateChannelState(channelId, {
        balanceA,
        balanceB,
        seqno,
        signature: signedState
      });

      return res.json({ 
        success: true,
        state: { balanceA, balanceB, seqno, signature: signedState }
      });
    } catch (error) {
      logger.error('Error signing channel state:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to sign channel state'
      });
    }
  }

  async closeChannel = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const { finalBalanceA, finalBalanceB, signatures } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const channel = await this.paymentService.getChannel(channelId);
      if (!channel) {
        return res.status(404).json({ success: false, error: 'Channel not found' });
      }

      await this.tonService.closePaymentChannel(
        Address.parse(channel.channelAddress),
        { finalBalanceA, finalBalanceB, signatures }
      );

      const closedChannel = await this.paymentService.closeChannel(channelId, {
        finalBalanceA,
        finalBalanceB
      });

      return res.json({ success: true, channel: closedChannel });
    } catch (error) {
      logger.error('Error closing channel:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to close channel'
      });
    }
  }

  async getChannels = async (req: Request, res: Response) => {
    try {
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);
      const channels = await this.paymentService.getUserChannels(initData.user.id);

      return res.json({ success: true, channels });
    } catch (error) {
      logger.error('Error getting channels:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get channels'
      });
    }
  }

  async getChannelState = async (req: Request, res: Response) => {
    try {
      const { channelId } = req.params;
      const channel = await this.paymentService.getChannel(channelId);
      
      if (!channel) {
        return res.status(404).json({ success: false, error: 'Channel not found' });
      }

      const state = await this.tonService.getChannelState(
        Address.parse(channel.channelAddress)
      );

      return res.json({ success: true, state });
    } catch (error) {
      logger.error('Error getting channel state:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get channel state'
      });
    }
  }
}