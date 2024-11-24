// scripts/deploy/backend.ts
import { exec } from 'child_process';
import { promisify } from 'util';
import * as path from 'path';
import { logger } from '../../utils/logger';

const execAsync = promisify(exec);

async function deployBackend() {
  try {
    logger.info('Starting backend deployment...');

    // Build the project
    logger.info('Building project...');
    await execAsync('npm run build');

    // Run database migrations
    logger.info('Running database migrations...');
    await execAsync('npm run migrate');

    // Deploy to server
    logger.info('Deploying to server...');
    const deployCommand = `
      rsync -avz --delete \
      --exclude 'node_modules' \
      --exclude '.git' \
      --exclude 'logs' \
      ./dist/ ${process.env.DEPLOY_USER}@${process.env.DEPLOY_HOST}:${process.env.DEPLOY_PATH}
    `;
    await execAsync(deployCommand);

    // Restart services
    logger.info('Restarting services...');
    const restartCommand = `
      ssh ${process.env.DEPLOY_USER}@${process.env.DEPLOY_HOST} '
        cd ${process.env.DEPLOY_PATH} && \
        npm install --production && \
        pm2 reload ton-betting-api'
    `;
    await execAsync(restartCommand);

    // Verify deployment
    logger.info('Verifying deployment...');
    await verifyDeployment();

    logger.info('Backend deployment completed successfully!');
  } catch (error) {
    logger.error('Error deploying backend:', error);
    throw error;
  }
}

async function verifyDeployment(): Promise<void> {
  try {
    const healthCheck = `curl -f http://${process.env.DEPLOY_HOST}:${process.env.PORT}/health`;
    await execAsync(healthCheck);
    logger.info('Health check passed');
  } catch (error) {
    throw new Error('Deployment verification failed');
  }
}

if (require.main === module) {
  deployBackend()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}

export { deployBackend };