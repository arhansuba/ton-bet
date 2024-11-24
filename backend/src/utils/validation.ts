// validation.ts
import Joi from 'joi';
import { Address } from '@ton/core';
import { BetStatus } from '../models/Bet';

export const schemas = {
  bet: {
    create: Joi.object({
      description: Joi.string()
        .min(5)
        .max(500)
        .required()
        .trim(),
      amount: Joi.string()
        .pattern(/^\d+$/)
        .required()
        .messages({
          'string.pattern.base': 'Amount must be a valid number in nanotons'
        }),
      participants: Joi.array()
        .items(Joi.string())
        .max(10),
      expiryTime: Joi.number()
        .min(Date.now() + 5 * 60 * 1000)  // At least 5 minutes in the future
        .required(),
      betType: Joi.string()
        .valid('FRIEND', 'BIG')
        .default('FRIEND'),
      metadata: Joi.object({
        category: Joi.string(),
        tags: Joi.array().items(Joi.string()),
        customData: Joi.object()
      })
    }),

    join: Joi.object({
      userAddress: Joi.string()
        .custom((value, helpers) => {
          try {
            Address.parse(value);
            return value;
          } catch {
            return helpers.error('string.tonAddress');
          }
        })
        .required()
        .messages({
          'string.tonAddress': 'Invalid TON address format'
        })
    })
  },

  paymentChannel: {
    create: Joi.object({
      counterpartyAddress: Joi.string()
        .custom((value, helpers) => {
          try {
            Address.parse(value);
            return value;
          } catch {
            return helpers.error('string.tonAddress');
          }
        })
        .required(),
      initialBalance: Joi.string()
        .pattern(/^\d+$/)
        .required(),
      metadata: Joi.object({
        purpose: Joi.string().required(),
        customData: Joi.object()
      })
    }),

    updateState: Joi.object({
      balanceA: Joi.string()
        .pattern(/^\d+$/)
        .required(),
      balanceB: Joi.string()
        .pattern(/^\d+$/)
        .required(),
      seqno: Joi.number()
        .min(0)
        .required()
    })
  }
};

export const validateTonAddress = (address: string): boolean => {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
};

export const validateAmount = (amount: string): boolean => {
  try {
    return BigInt(amount) > 0;
  } catch {
    return false;
  }
};

export const validateExpiryTime = (expiryTime: number): boolean => {
  const minExpiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes
  return expiryTime > minExpiryTime;
};

export const validateBetStatus = (currentStatus: BetStatus, newStatus: BetStatus): boolean => {
  const validTransitions = {
    [BetStatus.PENDING]: [BetStatus.ACTIVE, BetStatus.EXPIRED],
    [BetStatus.ACTIVE]: [BetStatus.RESOLVED, BetStatus.EXPIRED],
    [BetStatus.RESOLVED]: [],
    [BetStatus.EXPIRED]: []
  };

  return validTransitions[currentStatus].includes(newStatus);
};

export const validateSignature = (message: string, signature: string, publicKey: string): boolean => {
  try {
    // Implement signature validation logic using TON SDK
    // This is a placeholder - actual implementation depends on the specific signing scheme used
    return true;
  } catch {
    return false;
  }
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')  // Remove potential HTML tags
    .slice(0, 1000);  // Limit length
};

export class ValidationError extends Error {
  constructor(
    public message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}