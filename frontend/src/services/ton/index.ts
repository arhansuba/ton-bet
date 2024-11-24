// index.ts
import BetContract from './contract';
import PaymentChannel from './payment-channel';
import { 
  TonClient, 
  WalletContractV4, 
  SendMode} from '@ton/ton';
import {
  Address,
  beginCell,
  toNano
} from '@ton/core';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { mnemonicToPrivateKey } from '@ton/crypto';

interface TransactionStatus {
  status: 'success' | 'failed' | 'not_found';
  description?: string;
}

type NetworkType = 'MAINNET' | 'TESTNET';

class TonService {
  private static instance: TonService;
  private client!: TonClient;
  private betContract: BetContract;

  private constructor() {
    this.betContract = new BetContract(
      (process.env.NEXT_PUBLIC_NETWORK || 'TESTNET') as NetworkType
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

  async getTransactionStatus(txHash: string): Promise<TransactionStatus> {
    try {
      const tx = await this.client.getTransaction(Address.parse(txHash), 'true', '');
      
      if (!tx) {
        return { status: 'not_found' };
      }

      // Check transaction result from description
      const description = tx.description?.toString();
      const isSuccessful = !description?.includes('error');

      return {
        status: isSuccessful ? 'success' : 'failed',
        description
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

    const provider = this.client.provider(wallet.address, { code: null, data: null }); // Get provider from client
    const seqno = await wallet.getSeqno(provider);
    
    return wallet.sendTransfer({
      secretKey: await this.getSecretKey(),
      messages: [{
        amount: toNano(amount),
        payload: messageBody,
        to: to,
      }],
      sendMode: SendMode.PAY_GAS_SEPARATELY
    }, {
      seqno,
      timeout: 60000 // Example timeout value
    });
  }

  private async getSecretKey() {
    if (!process.env.NEXT_PUBLIC_MNEMONIC) {
      throw new Error('Mnemonic not configured');
    }
    const keyPair = await mnemonicToPrivateKey(process.env.NEXT_PUBLIC_MNEMONIC.split(' '));
    return keyPair.secretKey;
  }
}

export const tonService = TonService.getInstance();