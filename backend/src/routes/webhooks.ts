// webhooks.ts
import { Router } from 'express';
import { WebhookController } from '../controllers/WebhookController';
import { validateWebhookSignature } from '../middleware/validation';
import { rateLimiter } from '../middleware/rate-limiter';

export function webhookRoutes(webhookController: WebhookController): Router {
  const router = Router();

  // TON blockchain events
  router.post(
    '/ton',
    rateLimiter('ton-webhook'),
    validateWebhookSignature('ton'),
    webhookController.handleTonEvents
  );

  // Telegram events
  router.post(
    '/telegram',
    rateLimiter('telegram-webhook'),
    validateWebhookSignature('telegram'),
    webhookController.handleTelegramEvents
  );

  // Notification events
  router.post(
    '/notifications',
    rateLimiter('notification-webhook'),
    validateWebhookSignature('notification'),
    webhookController.handleNotification
  );

  return router;
}