import { Request, Response } from 'express';
import { BetService } from '../services/BetService';
import { TonService } from '../services/TonService';
import { TelegramService } from '../services/TelegramService';
import { validateTelegramInitData } from '../middleware/auth';
import { logger } from '../utils/logger';
import { Address } from '@ton/core';

export class BetController {
  constructor(
    private betService: BetService,
    private tonService: TonService,
    private telegramService: TelegramService
  ) {}

  async createBet = async (req: Request, res: Response) => {
    try {
      const { amount, description, participants, expiryTime } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);
      
      const bet = await this.betService.createBet({
        creatorId: initData.user.id,
        amount,
        description,
        participants,
        expiryTime
      });

      const contractAddress = await this.tonService.deployBetContract(bet);
      
      await this.telegramService.notifyBetCreated(bet, contractAddress);

      return res.status(201).json({ 
        success: true, 
        bet: { ...bet, contractAddress }
      });
    } catch (error) {
      logger.error('Error creating bet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to create bet'
      });
    }
  }

  async joinBet = async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const { userAddress } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const bet = await this.betService.getBet(betId);
      if (!bet) {
        return res.status(404).json({ success: false, error: 'Bet not found' });
      }

      await this.tonService.verifyUserJoin(
        Address.parse(bet.contractAddress),
        Address.parse(userAddress),
        bet.amount
      );

      const updatedBet = await this.betService.joinBet(betId, {
        userId: initData.user.id,
        userAddress
      });

      await this.telegramService.notifyBetJoined(updatedBet);

      return res.json({ success: true, bet: updatedBet });
    } catch (error) {
      logger.error('Error joining bet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to join bet'
      });
    }
  }

  async resolveBet = async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const { winnerId } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const bet = await this.betService.getBet(betId);
      if (!bet) {
        return res.status(404).json({ success: false, error: 'Bet not found' });
      }

      if (bet.creatorId !== initData.user.id) {
        return res.status(403).json({ success: false, error: 'Not authorized' });
      }

      const resolvedBet = await this.betService.resolveBet(betId, winnerId);
      await this.tonService.resolveBetContract(
        Address.parse(bet.contractAddress),
        winnerId
      );

      await this.telegramService.notifyBetResolved(resolvedBet);

      return res.json({ success: true, bet: resolvedBet });
    } catch (error) {
      logger.error('Error resolving bet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to resolve bet'
      });
    }
  }

  async getBets = async (req: Request, res: Response) => {
    try {
      const { status, userId } = req.query;
      const bets = await this.betService.getBets({
        status: status as string,
        userId: userId as string
      });

      return res.json({ success: true, bets });
    } catch (error) {
      logger.error('Error getting bets:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get bets'
      });
    }
  }

  async getBetDetails = async (req: Request, res: Response) => {
    try {
      const { betId } = req.params;
      const bet = await this.betService.getBet(betId);
      
      if (!bet) {
        return res.status(404).json({ success: false, error: 'Bet not found' });
      }

      const contractState = await this.tonService.getBetContractState(
        Address.parse(bet.contractAddress)
      );

      return res.json({ 
        success: true, 
        bet: { ...bet, contractState } 
      });
    } catch (error) {
      logger.error('Error getting bet details:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get bet details'
      });
    }
  }
}