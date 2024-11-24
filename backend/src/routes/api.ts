// api.ts
import { Router } from 'express';
import { BetController } from '../controllers/BetController';
import { UserController } from '../controllers/UserController';
import { PaymentController } from '../controllers/PaymentController';
import { validateTelegram, validateSchema } from '../middleware/validation';
import { rateLimiter } from '../middleware/rate-limiter';
import { 
  createBetSchema, 
  joinBetSchema,
  updateWalletSchema 
} from '../utils/validation';

export function apiRoutes(
  betController: BetController,
  userController: UserController,
  paymentController: PaymentController
): Router {
  const router = Router();

  // Bet routes
  router.post(
    '/bets',
    rateLimiter('create-bet'),
    validateTelegram,
    validateSchema(createBetSchema),
    betController.createBet
  );

  router.post(
    '/bets/:betId/join',
    rateLimiter('join-bet'),
    validateTelegram,
    validateSchema(joinBetSchema),
    betController.joinBet
  );

  router.post(
    '/bets/:betId/resolve',
    rateLimiter('resolve-bet'),
    validateTelegram,
    betController.resolveBet
  );

  router.get(
    '/bets',
    validateTelegram,
    betController.getBets
  );

  router.get(
    '/bets/:betId',
    validateTelegram,
    betController.getBetDetails
  );

  // User routes
  router.post(
    '/users/register',
    rateLimiter('register'),
    validateTelegram,
    userController.registerUser
  );

  router.put(
    '/users/wallet',
    rateLimiter('update-wallet'),
    validateTelegram,
    validateSchema(updateWalletSchema),
    userController.updateWallet
  );

  router.get(
    '/users/stats',
    validateTelegram,
    userController.getUserStats
  );

  router.get(
    '/users/leaderboard',
    validateTelegram,
    userController.getLeaderboard
  );

  // Payment Channel routes
  router.post(
    '/channels',
    rateLimiter('create-channel'),
    validateTelegram,
    paymentController.createPaymentChannel
  );

  router.post(
    '/channels/:channelId/state',
    rateLimiter('update-state'),
    validateTelegram,
    paymentController.signState
  );

  router.post(
    '/channels/:channelId/close',
    rateLimiter('close-channel'),
    validateTelegram,
    paymentController.closeChannel
  );

  router.get(
    '/channels',
    validateTelegram,
    paymentController.getChannels
  );

  router.get(
    '/channels/:channelId/state',
    validateTelegram,
    paymentController.getChannelState
  );

  return router;
}