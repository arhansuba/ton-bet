// index.ts
import { v4 as uuidv4 } from 'uuid';
import { Address } from '@ton/core';
import { Bet, BetStatus, CreateBetParams, BetQuery, JoinBetParams } from './types';
import { DatabaseService } from '../DatabaseService';
import { logger } from '../../utils/logger';

export class BetService {
  constructor(private db: DatabaseService) {}

  async createBet(params: CreateBetParams): Promise<Bet> {
    const bet: Bet = {
      id: uuidv4(),
      ...params,
      status: BetStatus.PENDING,
      createdAt: Date.now(),
      participants: []
    };

    await this.db.bets.insert(bet);
    return bet;
  }

  async getBet(id: string): Promise<Bet | null> {
    return this.db.bets.findOne({ id });
  }

  async findBetByAddress(address: string): Promise<Bet | null> {
    return this.db.bets.findOne({ contractAddress: address });
  }

  async joinBet(betId: string, params: JoinBetParams): Promise<Bet> {
    const bet = await this.getBet(betId);
    if (!bet) throw new Error('Bet not found');

    if (bet.status !== BetStatus.PENDING) {
      throw new Error('Bet is not in joinable state');
    }

    const updatedBet = {
      ...bet,
      participants: [...bet.participants, params.userId],
      status: BetStatus.ACTIVE
    };

    await this.db.bets.update({ id: betId }, updatedBet);
    return updatedBet;
  }

  async resolveBet(betId: string, winnerId: string): Promise<Bet> {
    const bet = await this.getBet(betId);
    if (!bet) throw new Error('Bet not found');

    if (bet.status !== BetStatus.ACTIVE) {
      throw new Error('Bet cannot be resolved');
    }

    const updatedBet = {
      ...bet,
      status: BetStatus.RESOLVED,
      winner: winnerId
    };

    await this.db.bets.update({ id: betId }, updatedBet);
    return updatedBet;
  }

  async getBets(query: BetQuery): Promise<Bet[]> {
    const filter: Record<string, any> = {};
    if (query.status) filter.status = query.status;
    if (query.userId) {
      filter.$or = [
        { creatorId: query.userId },
        { participants: query.userId }
      ];
    }
    return this.db.bets.find(filter);
  }

  async confirmParticipantJoined(betId: string, participant: string): Promise<void> {
    await this.db.bets.update(
      { id: betId },
      { $addToSet: { participants: participant } }
    );
  }

  async confirmBetResolution(betId: string, winner: string): Promise<void> {
    await this.db.bets.update(
      { id: betId },
      { $set: { status: BetStatus.RESOLVED, winner } }
    );
  }

  async handleUserLeft(chatId: string, userId: string): Promise<void> {
    await this.db.bets.update(
      { chatId, status: BetStatus.PENDING },
      { $pull: { participants: userId } }
    );
  }
}