// auth.ts
import { Request, Response, NextFunction } from 'express';
import { verifyTelegramWebAppData } from '@telegram-apps/init-data-node';
import { User } from '../models/User';
import { config } from '../config';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';

interface TelegramInitData {
  user: {
    id: string;
    username?: string;
    first_name?: string;
    last_name?: string;
  };
  auth_date: number;
  hash: string;
}

declare global {
  namespace Express {
    interface Request {
      user?: any;
      telegramData?: TelegramInitData;
    }
  }
}

export const validateTelegramInitData = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const initData = req.headers['x-telegram-init-data'];
    
    if (!initData || typeof initData !== 'string') {
      throw new ApiError('Missing Telegram authentication data', 401);
    }

    const isValid = await verifyTelegramWebAppData(
      initData,
      config.telegram.botToken
    );

    if (!isValid) {
      throw new ApiError('Invalid Telegram authentication data', 401);
    }

    const parsedData = Object.fromEntries(
      new URLSearchParams(initData)
    ) as unknown as TelegramInitData;

    // Validate auth date is not too old
    const maxAge = 24 * 60 * 60; // 24 hours
    if (Date.now() / 1000 - parsedData.auth_date > maxAge) {
      throw new ApiError('Authentication expired', 401);
    }

    req.telegramData = parsedData;

    // Attach user if exists
    const user = await User.findOne({ telegramId: parsedData.user.id });
    if (user) {
      req.user = user;
      // Update last active timestamp
      await User.updateOne(
        { _id: user._id },
        { lastActive: Date.now() }
      );
    }

    next();
  } catch (error) {
    logger.error('Auth middleware error:', error);
    next(error);
  }
};

export const requireUser = async (req: Request, res: Response, next: NextFunction) => {
  try {
    if (!req.user) {
      throw new ApiError('User registration required', 403);
    }
    next();
  } catch (error) {
    next(error);
  }
};

export const requireRole = (roles: string[]) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.user) {
        throw new ApiError('Authentication required', 401);
      }

      const hasRole = roles.some(role => req.user.roles.includes(role));
      if (!hasRole) {
        throw new ApiError('Insufficient permissions', 403);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};

export const validateWebhookSignature = (type: 'ton' | 'telegram' | 'notification') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const signature = req.headers['x-signature'];
      if (!signature) {
        throw new ApiError('Missing webhook signature', 401);
      }

      let isValid = false;
      switch (type) {
        case 'ton':
          isValid = validateTonSignature(req.body, signature as string);
          break;
        case 'telegram':
          isValid = validateTelegramSignature(req.body, signature as string);
          break;
        case 'notification':
          isValid = validateNotificationSignature(req.body, signature as string);
          break;
      }

      if (!isValid) {
        throw new ApiError('Invalid webhook signature', 401);
      }

      next();
    } catch (error) {
      next(error);
    }
  };
};