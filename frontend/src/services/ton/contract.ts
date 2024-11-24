// src/services/ton/contract.ts
import { 
  Address, 
  beginCell, 
  toNano, 
  fromNano,
  Cell
} from '@ton/core';
import { TonClient } from '@ton/ton';
import { getHttpEndpoint } from '@orbs-network/ton-access';
import { 
  CONTRACT_ADDRESSES,
  CONTRACT_OPCODES,
  NETWORKS,
  BET_STATUS,
  type NetworkType
} from '../../utils/constants/ton';
import { BetData, ExtendedContract } from '../../utils/types/contract';

class BetContract {
  private client: TonClient;
  private contract: Address;

  constructor(network: NetworkType = 'MAINNET') {
    this.contract = Address.parse(CONTRACT_ADDRESSES[network]);
    this.client = {} as TonClient; // Initialize to avoid undefined
  }

  async connect() {
    const endpoint = await getHttpEndpoint({
      network: NETWORKS.MAINNET === 'mainnet' ? 'mainnet' : 'testnet'
    });
    
    this.client = new TonClient({ endpoint });
  }

  async createBet(
    wallet: ExtendedContract,
    amount: string,
    description: string
  ) {
    const descriptionCell = beginCell()
      .storeUint(0, 32) // String type tag
      .storeStringTail(description)
      .endCell();

    const messageBody = beginCell()
      .storeUint(CONTRACT_OPCODES.CREATE_BET, 32)
      .storeUint(0n, 64) // query id as bigint
      .storeRef(descriptionCell)
      .endCell();

    const sender = wallet.getSender(wallet.keyPair.secretKey);
    return sender.send({
      to: this.contract,
      value: toNano(amount),
      body: messageBody,
    });
  }

  async joinBet(
    wallet: ExtendedContract,
    betId: number,
    amount: string
  ) {
    const messageBody = beginCell()
      .storeUint(CONTRACT_OPCODES.JOIN_BET, 32)
      .storeUint(0n, 64) // query id as bigint
      .storeUint(BigInt(betId), 32)
      .endCell();

    const sender = wallet.getSender(wallet.keyPair.secretKey);
    return sender.send({
      to: this.contract,
      value: toNano(amount),
      body: messageBody,
    });
  }

  async resolveBet(
    wallet: ExtendedContract,
    betId: number,
    winnerAddress: Address
  ) {
    const messageBody = beginCell()
      .storeUint(CONTRACT_OPCODES.RESOLVE, 32)
      .storeUint(0n, 64) // query id as bigint
      .storeUint(BigInt(betId), 32)
      .storeAddress(winnerAddress)
      .endCell();

    const sender = wallet.getSender(wallet.keyPair.secretKey);
    return sender.send({
      to: this.contract,
      value: toNano('0.05'), // Gas fee
      body: messageBody,
    });
  }

  // Get methods for reading contract state
  async getBetInfo(betId: number): Promise<BetData> {
    const { stack } = await this.client.callGetMethod(
      this.contract,
      'get_bet_info',
      [{ type: 'int', value: BigInt(betId) }]
    );

    const creator = stack.readAddress();
    const amount = fromNano(stack.readBigNumber());
    const descriptionCell = Cell.fromBoc(Buffer.from(stack.readCell().bits.toString(), 'base64'))[0];

    return {
      creator,
      amount,
      description: descriptionCell.beginParse().loadStringTail(),
      participants: [], // Will be loaded separately
      status: BET_STATUS.ACTIVE // Default until we load actual status
    };
  }

  async getBetParticipants(betId: number): Promise<Address[]> {
    const { stack } = await this.client.callGetMethod(
      this.contract,
      'get_participants',
      [{ type: 'int', value: BigInt(betId) }]
    );

    const participantsCell = Cell.fromBoc(Buffer.from(stack.readCell().bits.toString(), 'base64'))[0];
    
    // Parse dictionary of participants
    const participants: Address[] = [];
    const slice = participantsCell.beginParse();
    while (slice.remainingBits >= 267) { // Address size in bits
      participants.push(slice.loadAddress());
    }

    return participants;
  }

  async getBetStatus(betId: number): Promise<number> {
    const { stack } = await this.client.callGetMethod(
      this.contract,
      'get_status',
      [{ type: 'int', value: BigInt(betId) }]
    );

    return Number(stack.readBigNumber());
  }

  async getBetWinner(betId: number): Promise<Address | undefined> {
    const { stack } = await this.client.callGetMethod(
      this.contract,
      'get_winner',
      [{ type: 'int', value: BigInt(betId) }]
    );

    try {
      return stack.readAddress();
    } catch {
      return undefined;
    }
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