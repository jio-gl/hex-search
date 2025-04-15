import { ethers } from 'ethers';
import { logger } from '../utils/logger';
import { CrawlerConfig } from '../types/config';
import { JsonRpcProvider } from 'ethers';
import { Block, TransactionResponse } from 'ethers';

export class EthereumCrawler {
  private provider: JsonRpcProvider;
  private isRunning: boolean = false;
  private lastProcessedBlock: number = 0;
  private lastRequestTime: number = 0;
  private requestDelay: number = 500; // Increased to 500ms base delay
  private readonly maxDelay: number = 2000; // Max 2 second delay
  private readonly delayMultiplier: number = 2; // More aggressive delay increase

  constructor(private config: CrawlerConfig) {
    this.provider = new JsonRpcProvider(
      `https://mainnet.infura.io/v3/${config.infuraApiKey}`
    );
  }

  async start(): Promise<void> {
    if (this.isRunning) {
      logger.warn('Crawler is already running');
      return;
    }

    this.isRunning = true;
    logger.info('Starting Ethereum crawler');

    try {
      // Get the latest block number as our starting point
      this.lastProcessedBlock = await this.provider.getBlockNumber();
      logger.info(`Starting from block ${this.lastProcessedBlock}`);

      // Subscribe to new blocks
      this.provider.on('block', async (blockNumber: number) => {
        try {
          await this.processBlock(blockNumber);
        } catch (error) {
          logger.error(`Error processing block ${blockNumber}:`, error);
        }
      });

    } catch (error) {
      logger.error('Error starting crawler:', error);
      this.isRunning = false;
      throw error;
    }
  }

  async stop(): Promise<void> {
    logger.info('Stopping Ethereum crawler');
    this.isRunning = false;
    this.provider.removeAllListeners();
  }

  private async processBlock(blockNumber: number): Promise<void> {
    if (!this.isRunning) return;

    try {
      await this.throttle();
      // Get block with full transaction objects in a single request
      const block = await this.provider.getBlock(blockNumber, true) as Block & { transactions: TransactionResponse[] };
      if (!block) {
        logger.warn(`Block ${blockNumber} not found`);
        return;
      }

      logger.info(`Processing block ${blockNumber} with ${block.transactions.length} transactions`);
      const addresses = new Set<string>();

      // Add fee recipient address (miner/validator address)
      if (block.miner) {
        addresses.add(block.miner.toLowerCase());
      }

      // Process all transactions from the block response
      // When includeTransactions is true, we get full transaction objects
      for (const tx of block.transactions) {
        if (tx.from) {
          addresses.add(tx.from.toLowerCase());
        }
        if (tx.to) {
          addresses.add(tx.to.toLowerCase());
        }
      }

      // Store addresses in database
      if (addresses.size > 0) {
        await this.storeAddresses(Array.from(addresses), blockNumber);
      }

      this.lastProcessedBlock = blockNumber;
      logger.info(`Completed processing block ${blockNumber}, found ${addresses.size} unique addresses: ${Array.from(addresses).join(', ')}`);

    } catch (error: any) {
      logger.error(`Error processing block ${blockNumber}:`, error);
      // If we hit rate limits, increase the delay more aggressively
      if (error?.message?.includes('Too Many Requests')) {
        this.requestDelay = Math.min(this.requestDelay * this.delayMultiplier, this.maxDelay);
        logger.info(`Increased request delay to ${this.requestDelay}ms due to rate limiting`);
        // Add extra delay after rate limit error
        await new Promise(resolve => setTimeout(resolve, this.requestDelay));
      }
      throw error;
    }
  }

  private async storeAddresses(addresses: string[], blockNumber: number): Promise<void> {
    try {
      // For each address, create an entry with the etherscan URL
      const addressEntries = addresses.map(address => ({
        address: address,
        blockNumber: blockNumber,
        timestamp: new Date(),
        url: `https://etherscan.io/address/${address}`
      }));

      // TODO: Store in database (will implement in next step)
      logger.info(`Storing ${addressEntries.length} addresses from block ${blockNumber}`);
      
    } catch (error) {
      logger.error('Error storing addresses:', error);
      throw error;
    }
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  public getLastProcessedBlock(): number {
    return this.lastProcessedBlock;
  }

  private async throttle(): Promise<void> {
    const currentTime = Date.now();
    const elapsedTime = currentTime - this.lastRequestTime;

    if (elapsedTime < this.requestDelay) {
      await new Promise(resolve => setTimeout(resolve, this.requestDelay - elapsedTime));
    }

    this.lastRequestTime = currentTime;
  }
} 