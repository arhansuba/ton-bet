// validation.ts
import { Address } from '@ton/core';
import { z } from 'zod';

// Custom error class
export class ValidationError extends Error {
  constructor(
    message: string,
    public field?: string,
    public code?: string
  ) {
    super(message);
    this.name = 'ValidationError';
  }
}

// TON Address validation
export const isValidTonAddress = (address: string): boolean => {
  try {
    Address.parse(address);
    return true;
  } catch {
    return false;
  }
};

// Amount validation
export const isValidAmount = (amount: string): boolean => {
  try {
    const value = BigInt(amount);
    return value > 0;
  } catch {
    return false;
  }
};

// Common validation schemas
export const schemas = {
  bet: z.object({
    amount: z.string()
      .min(1, 'Amount is required')
      .refine(isValidAmount, 'Invalid amount format'),
    description: z.string()
      .min(5, 'Description must be at least 5 characters')
      .max(500, 'Description must be less than 500 characters'),
    expiryTime: z.number()
      .min(Date.now() + 5 * 60 * 1000, 'Expiry time must be at least 5 minutes in the future'),
    maxParticipants: z.number()
      .min(2, 'Minimum 2 participants required')
      .max(10, 'Maximum 10 participants allowed')
  }),

  channel: z.object({
    counterpartyAddress: z.string()
      .refine(isValidTonAddress, 'Invalid TON address'),
    initialBalance: z.string()
      .min(1, 'Initial balance is required')
      .refine(isValidAmount, 'Invalid amount format'),
    metadata: z.object({
      purpose: z.string().min(1, 'Purpose is required'),
      customData: z.any().optional()
    }).optional()
  })
};

// Input sanitization
export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>]/g, '')
    .slice(0, 1000);
};

// Content type validation
export const isValidContentType = (contentType: string, allowedTypes: string[]): boolean => {
  return allowedTypes.includes(contentType.toLowerCase());
};

// File size validation
export const isValidFileSize = (size: number, maxSize: number): boolean => {
  return size <= maxSize;
};

// Date validation
export const isValidDate = (date: Date | number | string): boolean => {
  const timestamp = new Date(date).getTime();
  return !isNaN(timestamp) && timestamp > Date.now();
};

// Password strength validation
export const isStrongPassword = (password: string): boolean => {
  const minLength = 8;
  const hasUppercase = /[A-Z]/.test(password);
  const hasLowercase = /[a-z]/.test(password);
  const hasNumbers = /\d/.test(password);
  const hasSpecialChars = /[!@#$%^&*(),.?":{}|<>]/.test(password);
  
  return password.length >= minLength &&
    hasUppercase &&
    hasLowercase &&
    hasNumbers &&
    hasSpecialChars;
};

// Object validation helper
export const validateObject = <T>(
  data: unknown,
  schema: z.ZodType<T>
): T => {
  try {
    return schema.parse(data);
  } catch (error) {
    if (error instanceof z.ZodError) {
      throw new ValidationError(
        error.errors[0].message,
        error.errors[0].path.join('.'),
        'VALIDATION_ERROR'
      );
    }
    throw error;
  }
};

// Async validation wrapper
export const validateAsync = async <T>(
  validator: (data: T) => Promise<boolean> | boolean,
  data: T,
  errorMessage: string
): Promise<void> => {
  const isValid = await validator(data);
  if (!isValid) {
    throw new ValidationError(errorMessage);
  }
};