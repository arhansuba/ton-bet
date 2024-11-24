import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { TonService } from '../services/TonService';
import { validateTelegramInitData } from '../middleware/auth';
import { logger } from '../utils/logger';

export class UserController {
  constructor(
    private userService: UserService,
    private tonService: TonService
  ) {}

  async registerUser = async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const user = await this.userService.createUser({
        telegramId: initData.user.id,
        username: initData.user.username,
        firstName: initData.user.first_name,
        lastName: initData.user.last_name,
        walletAddress
      });

      return res.status(201).json({ success: true, user });
    } catch (error) {
      logger.error('Error registering user:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to register user'
      });
    }
  }

  async updateWallet = async (req: Request, res: Response) => {
    try {
      const { walletAddress } = req.body;
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);

      const updated = await this.userService.updateWallet(
        initData.user.id,
        walletAddress
      );

      return res.json({ success: true, user: updated });
    } catch (error) {
      logger.error('Error updating wallet:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to update wallet'
      });
    }
  }

  async getUserStats = async (req: Request, res: Response) => {
    try {
      const initData = validateTelegramInitData(req.headers['x-telegram-init-data']);
      const stats = await this.userService.getUserStats(initData.user.id);

      return res.json({ success: true, stats });
    } catch (error) {
      logger.error('Error getting user stats:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get user stats'
      });
    }
  }

  async getLeaderboard = async (req: Request, res: Response) => {
    try {
      const { timeframe = 'all' } = req.query;
      const leaderboard = await this.userService.getLeaderboard(timeframe as string);

      return res.json({ success: true, leaderboard });
    } catch (error) {
      logger.error('Error getting leaderboard:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get leaderboard'
      });
    }
  }

  async getUserProfile = async (req: Request, res: Response) => {
    try {
      const { userId } = req.params;
      const profile = await this.userService.getUserProfile(userId);

      if (!profile) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      return res.json({ success: true, profile });
    } catch (error) {
      logger.error('Error getting user profile:', error);
      return res.status(500).json({
        success: false,
        error: 'Failed to get user profile'
      });
    }
  }
}