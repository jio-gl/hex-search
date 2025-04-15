import dotenv from 'dotenv';

dotenv.config();

export interface ScyllaDBConfig {
  contactPoints: string[];
  localDataCenter: string;
  keyspace: string;
  username?: string;
  password?: string;
}

export interface RedisConfig {
  host: string;
  port: number;
}

export interface EthereumConfig {
  rpcUrl: string;
  startBlock: number;
  batchSize: number;
}

export interface BitcoinConfig {
  rpcUrl: string;
  rpcUser: string;
  rpcPassword: string;
  startBlock: number;
  batchSize: number;
}

export interface BlockchainConfig {
  ethereum: EthereumConfig;
  bitcoin: BitcoinConfig;
}

export interface CrawlerConfig {
  concurrency: number;
  interval: number;
}

export interface LogConfig {
  level: string;
}

export interface Config {
  scylladb: ScyllaDBConfig;
  redis: RedisConfig;
  blockchain: BlockchainConfig;
  crawler: CrawlerConfig;
  log: LogConfig;
}

export const config: Config = {
  scylladb: {
    contactPoints: (process.env.SCYLLA_CONTACT_POINTS || 'localhost').split(','),
    localDataCenter: process.env.SCYLLA_DATACENTER || 'datacenter1',
    keyspace: process.env.SCYLLA_KEYSPACE || 'hexsearch',
    username: process.env.SCYLLA_USERNAME,
    password: process.env.SCYLLA_PASSWORD,
  },
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
  },
  blockchain: {
    ethereum: {
      rpcUrl: process.env.ETH_RPC_URL || 'https://mainnet.infura.io/v3/your-infura-key',
      startBlock: parseInt(process.env.ETH_START_BLOCK || '0'),
      batchSize: parseInt(process.env.ETH_BATCH_SIZE || '10'),
    },
    bitcoin: {
      rpcUrl: process.env.BTC_RPC_URL || 'https://btc.getblock.io/mainnet/',
      rpcUser: process.env.BTC_RPC_USER || 'your-rpc-user',
      rpcPassword: process.env.BTC_RPC_PASSWORD || 'your-rpc-password',
      startBlock: parseInt(process.env.BTC_START_BLOCK || '0'),
      batchSize: parseInt(process.env.BTC_BATCH_SIZE || '10'),
    },
  },
  crawler: {
    concurrency: parseInt(process.env.CRAWLER_CONCURRENCY || '5'),
    interval: parseInt(process.env.CRAWLER_INTERVAL || '60000'), // 1 minute
  },
  log: {
    level: process.env.LOG_LEVEL || 'info',
  },
};
