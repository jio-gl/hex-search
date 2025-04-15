import { indexAddressGlobally, indexTransactionGlobally } from '../db/schema/global-index';
import { normalizeHex } from '../utils/hex';
import { logger } from '../utils/logger';

export class BitcoinCrawler {
  private provider: any;
  private db: any;
  private scyllaClient: any;

  constructor(provider: any, db: any, scyllaClient: any) {
    this.provider = provider;
    this.db = db;
    this.scyllaClient = scyllaClient;
  }

  private async getRawTransaction(txHash: string): Promise<any> {
    // Implementation would depend on the specific Bitcoin provider being used
    return this.provider.getRawTransaction(txHash);
  }

  public async processTransaction(blockNumber: number, txHash: string): Promise<void> {
    try {
      logger.debug(`Processing Bitcoin transaction ${txHash} from block ${blockNumber}`);

      // Get transaction details
      const tx = await this.getRawTransaction(txHash);

      // Extract inputs and outputs
      const inputs = tx.vin.map((input: any) => {
        return input.coinbase ? { coinbase: true } : { 
          txid: normalizeHex(input.txid),
          vout: input.vout,
          address: input.address ? normalizeHex(input.address) : null
        };
      });

      const outputs = tx.vout.map((output: any) => {
        return {
          value: output.value,
          n: output.n,
          address: output.scriptPubKey.addresses ? 
            normalizeHex(output.scriptPubKey.addresses[0]) : null
        };
      });

      // Save transaction to database
      const txData = {
        blockchain: 'bitcoin',
        hash: normalizeHex(txHash),
        blockNumber: blockNumber,
        inputs,
        outputs,
        timestamp: new Date(tx.time * 1000),
        createdAt: new Date()
      };

      await this.db.collection('transactions').updateOne(
        { blockchain: 'bitcoin', hash: normalizeHex(txHash) },
        { $set: txData },
        { upsert: true }
      );

      const timestamp = new Date(tx.time * 1000);

      // Save unique addresses to global index
      const addresses = new Set<string>();
      
      inputs.forEach((input: any) => {
        if (input.address) addresses.add(input.address);
      });
      
      outputs.forEach((output: any) => {
        if (output.address) addresses.add(output.address);
      });
      
      // Collect from/to addresses for global tx index
      const fromAddresses: string[] = [];
      const toAddresses: string[] = [];
      
      inputs.forEach((input: any) => {
        if (input.address) fromAddresses.push(input.address);
      });
      
      outputs.forEach((output: any) => {
        if (output.address) toAddresses.push(output.address);
      });
      
      // Add each address to global index
      for (const address of addresses) {
        await indexAddressGlobally(this.scyllaClient, address, 'bitcoin', timestamp);
      }
      
      // Add transaction to global index (use first address as from/to if multiple)
      await indexTransactionGlobally(
        this.scyllaClient,
        txHash,
        'bitcoin',
        blockNumber,
        fromAddresses[0] || null,
        toAddresses[0] || null,
        timestamp
      );
    } catch (error) {
      logger.error(`Error processing Bitcoin transaction ${txHash}:`, error);
      throw error;
    }
  }
} 