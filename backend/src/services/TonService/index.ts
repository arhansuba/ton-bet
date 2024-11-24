// index.ts
import { 
    TonClient, 
    WalletContractV4, 
    Address, 
    Cell, 
    beginCell, 
    toNano,
    fromNano 
  } from '@ton/ton';
  import { mnemonicToWalletKey } from '@ton/crypto';
  import { 
    ContractState, 
    BetContractData, 
    ChannelState, 
    CloseChannelData,
    SignedState
  } from './types';
  import { config } from '../../config';
  import { logger } from '../../utils/logger';
  
  export class TonService {
    private client: TonClient;
    private wallet: WalletContractV4;
  
    constructor() {
      this.client = new TonClient({
        endpoint: config.ton.endpoint,
        apiKey: config.ton.apiKey
      });
      this.initializeWallet();
    }
  
    private async initializeWallet() {
      try {
        const key = await mnemonicToWalletKey(config.ton.mnemonic.split(' '));
        this.wallet = WalletContractV4.create({
          publicKey: key.publicKey,
          workchain: 0
        });
      } catch (error) {
        logger.error('Failed to initialize wallet:', error);
        throw error;
      }
    }
  
    async deployBetContract(bet: BetContractData): Promise<string> {
      try {
        const betCode = Cell.fromBoc(config.ton.contracts.bet)[0];
        const betData = beginCell()
          .storeCoins(toNano(bet.amount))
          .storeRef(
            beginCell()
              .storeStringTail(bet.description)
              .endCell()
          )
          .storeDict(bet.participants.map(p => Address.parse(p)))
          .endCell();
  
        const stateInit = {
          code: betCode,
          data: betData
        };
  
        const address = new Address(0, Cell.fromBoc(stateInit)[0].hash());
        
        await this.wallet.sendDeploy(stateInit);
        
        return address.toString();
      } catch (error) {
        logger.error('Failed to deploy bet contract:', error);
        throw error;
      }
    }
  
    async deployPaymentChannel(channelData: any, counterparty: Address): Promise<string> {
      try {
        const channelCode = Cell.fromBoc(config.ton.contracts.paymentChannel)[0];
        const channelData = beginCell()
          .storeAddress(this.wallet.address)
          .storeAddress(counterparty)
          .storeCoins(toNano(channelData.initialBalance))
          .endCell();
  
        const stateInit = {
          code: channelCode,
          data: channelData
        };
  
        const address = new Address(0, Cell.fromBoc(stateInit)[0].hash());
        
        await this.wallet.sendDeploy(stateInit);
        
        return address.toString();
      } catch (error) {
        logger.error('Failed to deploy payment channel:', error);
        throw error;
      }
    }
  
    async verifyUserJoin(
      contractAddress: Address,
      userAddress: Address,
      amount: string
    ): Promise<boolean> {
      try {
        const contract = this.client.open(contractAddress);
        const transactions = await contract.getTransactions(1);
        
        if (!transactions.length) return false;
  
        const tx = transactions[0];
        const inMessage = tx.inMessage;
  
        if (!inMessage || inMessage.info.type !== 'internal') return false;
  
        return (
          inMessage.info.src.equals(userAddress) &&
          inMessage.info.value.coins === toNano(amount)
        );
      } catch (error) {
        logger.error('Failed to verify user join:', error);
        throw error;
      }
    }
  
    async resolveBetContract(
      contractAddress: Address,
      winnerId: string
    ): Promise<void> {
      try {
        const resolveMsg = beginCell()
          .storeUint(1, 32) // op: resolve
          .storeAddress(Address.parse(winnerId))
          .endCell();
  
        await this.wallet.sendTransfer({
          to: contractAddress,
          value: toNano('0.1'), // for gas
          body: resolveMsg
        });
      } catch (error) {
        logger.error('Failed to resolve bet:', error);
        throw error;
      }
    }
  
    async signChannelState(params: {
      channelAddress: Address,
      balanceA: string,
      balanceB: string,
      seqno: number
    }): Promise<SignedState> {
      try {
        const stateCell = beginCell()
          .storeAddress(params.channelAddress)
          .storeCoins(toNano(params.balanceA))
          .storeCoins(toNano(params.balanceB))
          .storeUint(params.seqno, 32)
          .endCell();
  
        const signature = await this.wallet.sign(stateCell.hash());
  
        return {
          signature: signature.toString('base64'),
          state: {
            balanceA: params.balanceA,
            balanceB: params.balanceB,
            seqno: params.seqno
          }
        };
      } catch (error) {
        logger.error('Failed to sign channel state:', error);
        throw error;
      }
    }
  
    async closePaymentChannel(
      channelAddress: Address,
      data: CloseChannelData
    ): Promise<void> {
      try {
        const closeMsg = beginCell()
          .storeUint(2, 32) // op: close
          .storeCoins(toNano(data.finalBalanceA))
          .storeCoins(toNano(data.finalBalanceB))
          .storeBuffer(Buffer.from(data.signatures.initiator, 'base64'))
          .storeBuffer(Buffer.from(data.signatures.counterparty, 'base64'))
          .endCell();
  
        await this.wallet.sendTransfer({
          to: channelAddress,
          value: toNano('0.1'), // for gas
          body: closeMsg
        });
      } catch (error) {
        logger.error('Failed to close payment channel:', error);
        throw error;
      }
    }
  
    async getBetContractState(address: Address): Promise<ContractState> {
      try {
        const contract = this.client.open(address);
        const state = await contract.getState();
        const balance = fromNano(state.balance);
  
        // Get contract-specific data
        const [status, lastUpdateTime] = await contract.get('get_bet_data');
  
        return {
          balance,
          status: status.toString(),
          lastUpdateTime: Number(lastUpdateTime)
        };
      } catch (error) {
        logger.error('Failed to get bet contract state:', error);
        throw error;
      }
    }
  
    async getChannelState(address: Address): Promise<ChannelState> {
      try {
        const contract = this.client.open(address);
        const [balanceA, balanceB, seqno, status] = await contract.get('get_channel_state');
  
        return {
          balanceA: fromNano(balanceA),
          balanceB: fromNano(balanceB),
          seqno: Number(seqno),
          status: status.toString()
        };
      } catch (error) {
        logger.error('Failed to get channel state:', error);
        throw error;
      }
    }
  
    async listenForEvents(): Promise<void> {
      // TODO: Implement blockchain event listening
      // This could involve watching for specific transactions or contract events
      // and emitting them to relevant services
    }
  }