// validation.ts
import { Request, Response, NextFunction } from 'express';
import Joi from 'joi';
import { logger } from '../utils/logger';
import { ApiError } from '../utils/errors';
import { Address } from '@ton/core';

export const validateSchema = (schema: Joi.Schema) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      await schema.validateAsync({
        body: req.body,
        query: req.query,
        params: req.params
      }, { abortEarly: false });
      next();
    } catch (error) {
      if (error instanceof Joi.ValidationError) {
        const errors = error.details.map(detail => ({
          field: detail.path.join('.'),
          message: detail.message
        }));
        next(new ApiError('Validation error', 400, { errors }));
      } else {
        next(error);
      }
    }
  };
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

// Common validation schemas
export const createBetSchema = Joi.object({
  body: Joi.object({
    amount: Joi.string()
      .custom((value, helpers) => {
        if (!validateAmount(value)) {
          return helpers.error('string.amount');
        }
        return value;
      })
      .required()
      .messages({
        'string.amount': 'Invalid amount format'
      }),
    description: Joi.string()
      .min(1)
      .max(500)
      .required(),
    participants: Joi.array()
      .items(Joi.string())
      .max(10),
    expiryTime: Joi.number()
      .min(Date.now() + 5 * 60 * 1000) // at least 5 minutes in the future
      .required()
  }).required()
});

export const joinBetSchema = Joi.object({
  body: Joi.object({
    userAddress: Joi.string()
      .custom((value, helpers) => {
        if (!validateTonAddress(value)) {
          return helpers.error('string.address');
        }
        return value;
      })
      .required()
      .messages({
        'string.address': 'Invalid TON address format'
      })
  }).required()
});

export const updateWalletSchema = Joi.object({
  body: Joi.object({
    walletAddress: Joi.string()
      .custom((value, helpers) => {
        if (!validateTonAddress(value)) {
          return helpers.error('string.address');
        }
        return value;
      })
      .required()
      .messages({
        'string.address': 'Invalid TON address format'
      })
  }).required()
});