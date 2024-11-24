// contract.ts
import { 
    Address, 
    beginCell, 
    toNano, 
    fromNano,
    Cell
  } from '@ton/core';
  import { TonClient, WalletContractV4 } from '@ton/ton';
  import { 
    CONTRACT_ADDRESSES,
    CONTRACT_OPCODES,
    NETWORKS,
    BET_STATUS
  } from '../../constants';
  import { getHttpEndpoint } from '@orbs-network/ton-access';
  
  export interface BetData {
    creator: Address;
    amount: string;
    description: string;
    participants: Address[];
    status: number;
    winner?: Address;
  }
  
  class BetContract {
    private client: TonClient;
    private contract: Address;
  
    constructor(network: keyof typeof NETWORKS = 'MAINNET') {
      this.contract = CONTRACT_ADDRESSES[network];
    }
  
    async connect() {
      const endpoint = await getHttpEndpoint({
        network: NETWORKS.MAINNET === 'mainnet' ? 'mainnet' : 'testnet'
      });
      
      this.client = new TonClient({ endpoint });
    }
  
    async createBet(
      wallet: WalletContractV4,
      amount: string,
      description: string
    ) {
      const descriptionCell = beginCell()
        .storeUint(0, 32) // String type tag
        .storeStringTail(description)
        .endCell();
  
      const messageBody = beginCell()
        .storeUint(CONTRACT_OPCODES.CREATE_BET, 32)
        .storeUint(0, 64) // query id
        .storeRef(descriptionCell)
        .endCell();
  
      const seqno = await wallet.getSeqno();
      
      return wallet.sendTransfer({
        seqno,
        messages: [{
          amount: toNano(amount),
          payload: messageBody,
          to: this.contract,
        }],
        secretKey: wallet.keyPair.secretKey
      });
    }
  
    async joinBet(
      wallet: WalletContractV4,
      betId: number,
      amount: string
    ) {
      const messageBody = beginCell()
        .storeUint(CONTRACT_OPCODES.JOIN_BET, 32)
        .storeUint(0, 64) // query id
        .storeUint(betId, 32)
        .endCell();
  
      const seqno = await wallet.getSeqno();
      
      return wallet.sendTransfer({
        seqno,
        messages: [{
          amount: toNano(amount),
          payload: messageBody,
          to: this.contract,
        }],
        secretKey: wallet.keyPair.secretKey
      });
    }
  
    async resolveBet(
      wallet: WalletContractV4,
      betId: number,
      winnerAddress: Address
    ) {
      const messageBody = beginCell()
        .storeUint(CONTRACT_OPCODES.RESOLVE, 32)
        .storeUint(0, 64) // query id
        .storeUint(betId, 32)
        .storeAddress(winnerAddress)
        .endCell();
  
      const seqno = await wallet.getSeqno();
      
      return wallet.sendTransfer({
        seqno,
        messages: [{
          amount: toNano('0.05'), // Gas fee
          payload: messageBody,
          to: this.contract,
        }],
        secretKey: wallet.keyPair.secretKey
      });
    }
  
    // Get methods for reading contract state
    async getBetInfo(betId: number): Promise<BetData> {
      const stack = await this.client.callGetMethod(
        this.contract,
        'get_bet_info',
        [{ type: 'int', value: betId.toString() }]
      );
  
      const [creator, amount, descriptionCell] = stack.map(item => item.value);
  
      return {
        creator: new Address(creator as string),
        amount: fromNano(amount as string),
        description: Cell.fromBoc(descriptionCell as string)[0]
          .beginParse()
          .loadStringTail(),
        participants: [], // Will be loaded separately
        status: BET_STATUS.ACTIVE // Default until we load actual status
      };
    }
  
    async getBetParticipants(betId: number): Promise<Address[]> {
      const stack = await this.client.callGetMethod(
        this.contract,
        'get_participants',
        [{ type: 'int', value: betId.toString() }]
      );
  
      const participantsDict = stack[0].value as string;
      const participantsCell = Cell.fromBoc(participantsDict)[0];
      
      // Parse dictionary of participants
      const participants: Address[] = [];
      let slice = participantsCell.beginParse();
      while (slice.remainingBits >= 267) { // Address size in bits
        participants.push(slice.loadAddress());
      }
  
      return participants;
    }
  
    async getBetStatus(betId: number): Promise<number> {
      const stack = await this.client.callGetMethod(
        this.contract,
        'get_status',
        [{ type: 'int', value: betId.toString() }]
      );
  
      return parseInt(stack[0].value as string);
    }
  
    async getBetWinner(betId: number): Promise<Address | undefined> {
      const stack = await this.client.callGetMethod(
        this.contract,
        'get_winner',
        [{ type: 'int', value: betId.toString() }]
      );
  
      const winner = stack[0].value as string;
      return winner ? new Address(winner) : undefined;
    }
  
    async getFullBetData(betId: number): Promise<BetData> {
      const [betInfo, participants, status, winner] = await Promise.all([
        this.getBetInfo(betId),
        this.getBetParticipants(betId),
        this.getBetStatus(betId),
        this.getBetWinner(betId),
      ]);
  
      return {
        ...betInfo,
        participants,
        status,
        winner
      };
    }
  }
  
  export default BetContract;