// src/constants/ton.ts
export const CONTRACT_ADDRESSES = {
    MAINNET: 'EQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPrHF',
    TESTNET: 'kQDKbjIcfM6ezt8KjKJJLshZJJSqX7XOA4ff-W72r5gqPgpP'
  } as const;
  
  export const CONTRACT_OPCODES = {
    CREATE_BET: 0x947c403e,
    JOIN_BET: 0x1d8129e2,
    RESOLVE: 0xb4028984
  } as const;
  
  export const NETWORKS = {
    MAINNET: 'mainnet',
    TESTNET: 'testnet'
  } as const;
  
  export const BET_STATUS = {
    ACTIVE: 0,
    COMPLETED: 1,
    CANCELLED: 2
  } as const;
  
  export type NetworkType = keyof typeof NETWORKS;
  export type ContractOpcode = typeof CONTRACT_OPCODES[keyof typeof CONTRACT_OPCODES];
  export type BetStatusType = typeof BET_STATUS[keyof typeof BET_STATUS];