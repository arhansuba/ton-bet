import { ContractProvider, Sender } from "@ton/core";
import { WalletContractV4 } from "@ton/ton";
import { Address } from "cluster";

// src/types/contracts.ts
export interface BetData {
    creator: Address;
    amount: string;
    description: string;
    participants: Address[];
    status: number;
    winner?: Address;
  }
  
  export interface ExtendedContract extends WalletContractV4 {
    keyPair: any;
    provider: ContractProvider;
    getSender: (secretKey: Buffer) => Sender;
  }