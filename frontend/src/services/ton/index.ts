// index.ts
import BetContract from './contract';
import PaymentChannel from './payment-channel';
import { 
  TonClient, 
  WalletContractV4,
  SendMode 
} from '@ton/ton';
import { 
  Address, 
  beginCell,
  toNano 
} from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { NETWORKS } from '../../constants';

class TonService {
  private static instance: TonService;
  private client: TonClient;
  private betContract: BetContract;

  private constructor() {
    this.betContract = new BetContract(
      process.env.NEXT_PUBLIC_NETWORK as keyof typeof NETWORKS
    );
  }

  public static getInstance(): TonService {
    if (!TonService.instance) {
      TonService.instance = new TonService();
    }
    return TonService.instance;
  }

  async init() {
    const endpoint = await getHttpEndpoint({
      network: process.env.NEXT_PUBLIC_NETWORK === 'MAINNET' ? 'mainnet' : 'testnet'
    });
    
    this.client = new TonClient({ endpoint });
    await this.betContract.connect();
  }

  getBetContract() {
    return this.betContract;
  }

  createPaymentChannel(
    channelAddress: Address,
    userWallet: WalletContractV4,
    platformWallet: Address
  ) {
    return new PaymentChannel(channelAddress, userWallet, platformWallet);
  }

  async getTransactionStatus(hash: string) {
    try {
      const tx = await this.client.getTransaction(hash);
      return {
        status: tx.exitCode === 0 ? 'success' : 'failed',
        exitCode: tx.exitCode,
        description: tx.description
      };
    } catch (error) {
      console.error('Error getting transaction status:', error);
      return { status: 'not_found' };
    }
  }

  async sendTon(
    wallet: WalletContractV4,
    to: Address,
    amount: string,
    message?: string
  ) {
    const messageBody = message 
      ? beginCell()
          .storeUint(0, 32)
          .storeStringTail(message)
          .endCell()
      : null;

    const seqno = await wallet.getSeqno();
    
    return wallet.sendTransfer({
      seqno,
      messages: [{
        amount: toNano(amount),
        payload: messageBody,
        to: to,
      }],
      secretKey: wallet.keyPair.secretKey,
      sendMode: SendMode.PAY_GAS_SEPARATELY
    });
  }
}

export const tonService = TonService.getInstance();