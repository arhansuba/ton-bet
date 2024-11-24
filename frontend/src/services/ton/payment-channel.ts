import {
  Address,
  beginCell,
  Cell,
  toNano,
  fromNano
} from '@ton/core';
import { TonClient, WalletContractV4 } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { KeyPair, sign } from '@ton/crypto';

type NetworkType = 'mainnet' | 'testnet';

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
  private client!: TonClient;
  private channelAddress: Address;
  private userWallet: WalletContractV4;
  private platformWallet: Address;
  private keyPair: KeyPair;

  constructor(
    channelAddress: Address,
    userWallet: WalletContractV4,
    platformWallet: Address,
    keyPair: KeyPair
  ) {
    this.channelAddress = channelAddress;
    this.userWallet = userWallet;
    this.platformWallet = platformWallet;
    this.keyPair = keyPair;
  }

  async connect(network: NetworkType = 'mainnet') {
    const endpoint = await getHttpEndpoint({
      network: network
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

    const walletContract = this.client.open(this.userWallet);
    
    return walletContract.sendTransfer({
      secretKey: this.keyPair.secretKey,
      messages: [{
        amount: toNano(config.initBalance),
        payload: messageBody,
        to: this.channelAddress,
      }],
      sendMode: 3,
    });
  }

  async signState(state: ChannelState): Promise<Cell> {
    const stateCell = beginCell()
      .storeCoins(toNano(state.balanceA))
      .storeCoins(toNano(state.balanceB))
      .storeUint(state.seqno, 32)
      .endCell();

    const signature = sign(
      stateCell.hash(),
      this.keyPair.secretKey
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

    const walletContract = this.client.open(this.userWallet);
    
    return walletContract.sendTransfer({
      secretKey: this.keyPair.secretKey,
      messages: [{
        amount: toNano('0.05'), // Gas fee
        payload: messageBody,
        to: this.channelAddress,
      }],
      sendMode: 3,
    });
  }

  async uncooperativeClose(state: ChannelState) {
    const signedState = await this.signState(state);

    const messageBody = beginCell()
      .storeUint(3, 32) // uncooperative close op
      .storeUint(0, 64) // query id
      .storeRef(signedState)
      .endCell();

    const walletContract = this.client.open(this.userWallet);
    
    return walletContract.sendTransfer({
      secretKey: this.keyPair.secretKey,
      messages: [{
        amount: toNano('0.05'), // Gas fee
        payload: messageBody,
        to: this.channelAddress,
      }],
      sendMode: 3,
    });
  }

  async getState(): Promise<ChannelState> {
    const result = await this.client.callGetMethod(
      this.channelAddress,
      'get_channel_state'
    );

    return {
      balanceA: fromNano(result.stack.readBigNumber()),
      balanceB: fromNano(result.stack.readBigNumber()),
      seqno: Number(result.stack.readBigNumber())
    };
  }
}

export default PaymentChannel;