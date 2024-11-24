// payment-channel.ts
import {
    Address,
    beginCell,
    Cell,
    toNano
  } from '@ton/core';
  import { TonClient, WalletContractV4 } from '@ton/ton';
  import { getHttpEndpoint } from '@orbs-network/ton-access';
  import { NETWORKS } from '../../constants';
  
  export interface ChannelConfig {
    initBalance: string;
    timeout: number;
  }
  
  export interface ChannelState {
    balanceA: string;
    balanceB: string;
    seqno: number;
  }
  
  class PaymentChannel {
    private client: TonClient;
    private channelAddress: Address;
    private userWallet: WalletContractV4;
    private platformWallet: Address;
  
    constructor(
      channelAddress: Address,
      userWallet: WalletContractV4,
      platformWallet: Address
    ) {
      this.channelAddress = channelAddress;
      this.userWallet = userWallet;
      this.platformWallet = platformWallet;
    }
  
    async connect(network: keyof typeof NETWORKS = 'MAINNET') {
      const endpoint = await getHttpEndpoint({
        network: NETWORKS.MAINNET === 'mainnet' ? 'mainnet' : 'testnet'
      });
      
      this.client = new TonClient({ endpoint });
    }
  
    async init(config: ChannelConfig) {
      const messageBody = beginCell()
        .storeUint(1, 32) // init op
        .storeUint(0, 64) // query id
        .storeCoins(toNano(config.initBalance))
        .storeUint(config.timeout, 32)
        .storeAddress(this.platformWallet)
        .endCell();
  
      const seqno = await this.userWallet.getSeqno();
      
      return this.userWallet.sendTransfer({
        seqno,
        messages: [{
          amount: toNano(config.initBalance),
          payload: messageBody,
          to: this.channelAddress,
        }],
        secretKey: this.userWallet.keyPair.secretKey
      });
    }
  
    async signState(state: ChannelState): Promise<Cell> {
      const stateCell = beginCell()
        .storeCoins(toNano(state.balanceA))
        .storeCoins(toNano(state.balanceB))
        .storeUint(state.seqno, 32)
        .endCell();
  
      const signature = this.userWallet.keyPair.secretKey.sign(
        stateCell.hash()
      );
  
      return beginCell()
        .storeBuffer(signature)
        .storeRef(stateCell)
        .endCell();
    }
  
    async cooperativeClose(finalState: ChannelState) {
      const signedState = await this.signState(finalState);
  
      const messageBody = beginCell()
        .storeUint(2, 32) // cooperative close op
        .storeUint(0, 64) // query id
        .storeRef(signedState)
        .endCell();
  
      const seqno = await this.userWallet.getSeqno();
      
      return this.userWallet.sendTransfer({
        seqno,
        messages: [{
          amount: toNano('0.05'), // Gas fee
          payload: messageBody,
          to: this.channelAddress,
        }],
        secretKey: this.userWallet.keyPair.secretKey
      });
    }
  
    async uncooperativeClose(state: ChannelState) {
      const signedState = await this.signState(state);
  
      const messageBody = beginCell()
        .storeUint(3, 32) // uncooperative close op
        .storeUint(0, 64) // query id
        .storeRef(signedState)
        .endCell();
  
      const seqno = await this.userWallet.getSeqno();
      
      return this.userWallet.sendTransfer({
        seqno,
        messages: [{
          amount: toNano('0.05'), // Gas fee
          payload: messageBody,
          to: this.channelAddress,
        }],
        secretKey: this.userWallet.keyPair.secretKey
      });
    }
  
    async getState(): Promise<ChannelState> {
      const stack = await this.client.callGetMethod(
        this.channelAddress,
        'get_channel_state',
        []
      );
  
      return {
        balanceA: fromNano(stack[0].value as string),
        balanceB: fromNano(stack[1].value as string),
        seqno: parseInt(stack[2].value as string)
      };
    }
  }
  
  export default PaymentChannel;