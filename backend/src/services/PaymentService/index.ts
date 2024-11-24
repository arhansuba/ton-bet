// index.ts
import { v4 as uuidv4 } from 'uuid';
import { Address } from '@ton/core';
import { PaymentChannel, ChannelStatus, CreateChannelParams, UpdateChannelStateParams, CloseChannelParams } from './types';
import { DatabaseService } from '../DatabaseService';
import { logger } from '../../utils/logger';

export class PaymentService {
  constructor(private db: DatabaseService) {}

  async createChannel(params: CreateChannelParams): Promise<PaymentChannel> {
    const channel: PaymentChannel = {
      id: uuidv4(),
      userId: params.userId,
      counterpartyAddress: params.counterpartyAddress,
      initialBalance: params.initialBalance,
      currentBalanceA: params.initialBalance,
      currentBalanceB: '0',
      seqno: 0,
      status: ChannelStatus.PENDING,
      createdAt: Date.now()
    };

    await this.db.channels.insert(channel);
    return channel;
  }

  async getChannel(id: string): Promise<PaymentChannel | null> {
    return this.db.channels.findOne({ id });
  }

  async findChannelByAddress(address: string): Promise<PaymentChannel | null> {
    return this.db.channels.findOne({ channelAddress: address });
  }

  async updateChannelState(channelId: string, params: UpdateChannelStateParams): Promise<PaymentChannel> {
    const channel = await this.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    if (channel.status !== ChannelStatus.OPEN) {
      throw new Error('Channel is not open');
    }

    if (params.seqno <= channel.seqno) {
      throw new Error('Invalid sequence number');
    }

    const updatedChannel = {
      ...channel,
      currentBalanceA: params.balanceA,
      currentBalanceB: params.balanceB,
      seqno: params.seqno,
      latestSignature: params.signature
    };

    await this.db.channels.update({ id: channelId }, updatedChannel);
    return updatedChannel;
  }

  async closeChannel(channelId: string, params: CloseChannelParams): Promise<PaymentChannel> {
    const channel = await this.getChannel(channelId);
    if (!channel) throw new Error('Channel not found');

    if (channel.status === ChannelStatus.CLOSED) {
      throw new Error('Channel is already closed');
    }

    const updatedChannel = {
      ...channel,
      status: ChannelStatus.CLOSING,
      currentBalanceA: params.finalBalanceA,
      currentBalanceB: params.finalBalanceB
    };

    await this.db.channels.update({ id: channelId }, updatedChannel);
    return updatedChannel;
  }

  async getUserChannels(userId: string): Promise<PaymentChannel[]> {
    return this.db.channels.find({ userId });
  }

  async finalizeChannelClosure(channelId: string, finalState: any): Promise<void> {
    await this.db.channels.update(
      { id: channelId },
      { 
        $set: { 
          status: ChannelStatus.CLOSED,
          currentBalanceA: finalState.balanceA,
          currentBalanceB: finalState.balanceB
        } 
      }
    );
  }
}