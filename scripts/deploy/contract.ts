import { NetworkProvider, sleep } from '@ton/blueprint';
import { TonClient, WalletContractV4, internal, Address } from '@ton/ton';
import { mnemonicToPrivateKey } from '@ton/crypto';
import { config } from '../../config';
import { logger } from '../../utils/logger';

async function deployContracts() {
  try {
    logger.info('Starting contract deployment...');
    
    // Initialize TON client
    const client = new TonClient({
      endpoint: config.network.endpoint,
      apiKey: config.network.apiKey
    });

    // Initialize deployer wallet
    const key = await mnemonicToPrivateKey(config.wallet.mnemonic.split(' '));
    const wallet = WalletContractV4.create({
      publicKey: key.publicKey,
      workchain: config.wallet.workchain
    });
    const contract = client.open(wallet);

    // Deploy Bet Contract
    logger.info('Deploying Bet Contract...');
    const betCode = Buffer.from(config.contracts.bet.code, 'base64');
    const betData = await buildBetInitialData(); // Helper function to build initial data
    const betAddress = await deployContract(contract, betCode, betData);
    logger.info(`Bet Contract deployed at: ${betAddress}`);

    // Deploy Payment Channel Contract
    logger.info('Deploying Payment Channel Contract...');
    const channelCode = Buffer.from(config.contracts.paymentChannel.code, 'base64');
    const channelData = await buildChannelInitialData(); // Helper function to build initial data
    const channelAddress = await deployContract(contract, channelCode, channelData);
    logger.info(`Payment Channel Contract deployed at: ${channelAddress}`);

    // Verify deployments
    await verifyDeployments([betAddress, channelAddress]);

    logger.info('Contract deployment completed successfully!');
    
    // Return deployed addresses
    return {
      betAddress,
      channelAddress
    };
  } catch (error) {
    logger.error('Error deploying contracts:', error);
    throw error;
  }
}

async function deployContract(
  wallet: WalletContractV4,
  code: Buffer,
  data: any
): Promise<Address> {
  try {
    const stateInit = {
      code: code,
      data: data
    };

    const address = new Address(0, stateInit.code.hash());
    
    // Send deployment transaction
    await wallet.sendDeploy(stateInit);
    
    // Wait for deployment
    await waitForDeployment(address);
    
    return address;
  } catch (error) {
    logger.error('Error in contract deployment:', error);
    throw error;
  }
}

async function waitForDeployment(address: Address, attempts = 10): Promise<void> {
  for (let i = 0; i < attempts; i++) {
    const state = await client.getContractState(address);
    if (state.state === 'active') {
      return;
    }
    await sleep(2000);
  }
  throw new Error(`Contract deployment timeout: ${address.toString()}`);
}

async function verifyDeployments(addresses: Address[]): Promise<void> {
  for (const address of addresses) {
    const state = await client.getContractState(address);
    if (state.state !== 'active') {
      throw new Error(`Contract verification failed for: ${address.toString()}`);
    }
  }
}

if (require.main === module) {
  deployContracts()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployContracts };