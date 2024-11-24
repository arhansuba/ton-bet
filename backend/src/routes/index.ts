// index.ts
import { Router } from 'express';
import { apiRoutes } from './api';
import { webhookRoutes } from './webhooks';
import { BetController } from '../controllers/BetController';
import { UserController } from '../controllers/UserController';
import { PaymentController } from '../controllers/PaymentController';
import { WebhookController } from '../controllers/WebhookController';
import { errorHandler } from '../middleware/error-handler';
import { requestLogger } from '../middleware/logger';

export function createRouter(
  betController: BetController,
  userController: UserController,
  paymentController: PaymentController,
  webhookController: WebhookController
): Router {
  const router = Router();

  // Global middleware
  router.use(requestLogger);

  // Routes
  router.use('/api/v1', apiRoutes(betController, userController, paymentController));
  router.use('/webhooks', webhookRoutes(webhookController));

  // Health check
  router.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: Date.now() });
  });

  // Version
  router.get('/version', (req, res) => {
    res.json({
      version: process.env.APP_VERSION || '1.0.0',
      environment: process.env.NODE_ENV
    });
  });

  // Error handling
  router.use(errorHandler);

  return router;
}