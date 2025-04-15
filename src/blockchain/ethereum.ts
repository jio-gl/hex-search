import { indexAddressGlobally, indexTransactionGlobally } from '../db/schema/global-index';
import { normalizeHex } from '../utils/hex';
import { logger } from '../utils/logger';

export class EthereumCrawler {
  private provider: any;
  private db: any;
  private scyllaClient: any;

  constructor(provider: any, db: any, scyllaClient: any) {
    this.provider = provider;
    this.db = db;
    this.scyllaClient = scyllaClient;
  }

  public async processTransaction(blockNumber: number, txHash: string): Promise<void> {
    try {
      logger.debug(`Processing Ethereum transaction ${txHash} from block ${blockNumber}`);

      const tx = await this.provider.getTransaction(txHash);
      if (!tx) {
        logger.warn(`Transaction ${txHash} not found`);
        return;
      }

      // Save transaction to database
      const txData = {
        blockchain: 'ethereum',
        hash: normalizeHex(tx.hash),
        blockNumber: blockNumber,
        from: normalizeHex(tx.from),
        to: tx.to ? normalizeHex(tx.to) : null,
        value: tx.value.toString(),
        timestamp: new Date(), // This will be updated when we process the block
        createdAt: new Date()
      };

      await this.db.collection('transactions').updateOne(
        { blockchain: 'ethereum', hash: normalizeHex(tx.hash) },
        { $set: txData },
        { upsert: true }
      );

      // Get block for timestamp
      const block = await this.provider.getBlock(blockNumber);
      const timestamp = block ? new Date(Number(block.timestamp) * 1000) : new Date();

      // Save addresses to global index
      await indexAddressGlobally(this.scyllaClient, tx.from, 'ethereum', timestamp);
      
      if (tx.to) {
        await indexAddressGlobally(this.scyllaClient, tx.to, 'ethereum', timestamp);
      }
      
      // Save transaction to global index
      await indexTransactionGlobally(
        this.scyllaClient,
        tx.hash,
        'ethereum',
        blockNumber,
        tx.from,
        tx.to,
        timestamp
      );
    } catch (error) {
      logger.error(`Error processing Ethereum transaction ${txHash}:`, error);
      throw error;
    }
  }
} 