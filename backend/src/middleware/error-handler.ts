// error-handler.ts
import { Request, Response, NextFunction } from 'express';
import { ApiError } from '../utils/errors';
import { logger } from '../utils/logger';
import { config } from '../config';

interface ErrorResponse {
  success: false;
  error: {
    message: string;
    code?: string;
    details?: any;
  };
  requestId?: string;
}

export const errorHandler = (
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  // Log error
  logger.error('Error Handler:', {
    error: err,
    requestId: req.headers['x-request-id'],
    path: req.path,
    method: req.method,
    ip: req.ip
  });

  // Prepare error response
  const response: ErrorResponse = {
    success: false,
    error: {
      message: 'Internal server error'
    },
    requestId: req.headers['x-request-id'] as string
  };

  // Handle specific error types
  if (err instanceof ApiError) {
    response.error = {
      message: err.message,
      code: err.code,
      details: err.details
    };
    res.status(err.statusCode);
  } else if (err.name === 'UnauthorizedError') {
    response.error.message = 'Unauthorized';
    response.error.code = 'UNAUTHORIZED';
    res.status(401);
  } else if (err.name === 'ValidationError') {
    response.error.message = 'Validation Error';
    response.error.code = 'VALIDATION_ERROR';
    response.error.details = err.message;
    res.status(400);
  } else {
    // Default to 500 for unhandled errors
    res.status(500);

    // Only show detailed error in development
    if (config.environment === 'development') {
      response.error.details = {
        name: err.name,
        message: err.message,
        stack: err.stack
      };
    }

    // Alert monitoring system for unhandled errors
    if (config.environment === 'production') {
      // TODO: Implement error monitoring service integration
      // errorMonitoring.captureException(err);
    }
  }

  // Send error response
  res.json(response);
};

// Custom error class for API errors
export class ApiError extends Error {
  constructor(
    public message: string,
    public statusCode: number = 500,
    public details?: any,
    public code?: string
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Helper function to wrap async route handlers
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};