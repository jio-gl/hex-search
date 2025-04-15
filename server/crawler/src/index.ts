import { config } from 'dotenv';
import { EthereumCrawler } from './services/ethereum-crawler';
import { logger } from './utils/logger';

// Load environment variables
config();

const REQUIRED_ENV_VARS = ['INFURA_API_KEY'];

// Validate environment variables
for (const envVar of REQUIRED_ENV_VARS) {
  if (!process.env[envVar]) {
    logger.error(`Missing required environment variable: ${envVar}`);
    process.exit(1);
  }
}

// Create crawler configuration
const crawlerConfig = {
  infuraApiKey: process.env.INFURA_API_KEY!,
  dbConfig: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '9042'),
    keyspace: process.env.DB_KEYSPACE || 'hex_search',
  },
  crawlerConfig: {
    maxBlocksPerBatch: parseInt(process.env.MAX_BLOCKS_PER_BATCH || '100'),
    batchIntervalMs: parseInt(process.env.BATCH_INTERVAL_MS || '12000'),
  },
};

async function main() {
  try {
    const crawler = new EthereumCrawler(crawlerConfig);
    
    // Handle graceful shutdown
    process.on('SIGINT', async () => {
      logger.info('Received SIGINT signal. Shutting down crawler...');
      await crawler.stop();
      process.exit(0);
    });

    process.on('SIGTERM', async () => {
      logger.info('Received SIGTERM signal. Shutting down crawler...');
      await crawler.stop();
      process.exit(0);
    });

    // Start the crawler
    await crawler.start();
    
  } catch (error) {
    logger.error('Fatal error in crawler:', error);
    process.exit(1);
  }
}

main().catch((error) => {
  logger.error('Unhandled error:', error);
  process.exit(1);
});
