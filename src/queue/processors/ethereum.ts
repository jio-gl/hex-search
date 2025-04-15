import { Client } from 'cassandra-driver';
import { Job } from 'bull';
import { indexAddressGlobally, indexTransactionGlobally } from '../../db/schema/global-index';
import { initScyllaClient } from '../../db/scylla';
import { normalizeHex } from '../../utils/hex';
import { logger } from '../../utils/logger';
import { getDbConnection } from '../../db/mongo';
import { getProvider } from '../../providers/ethereum';
import { storeAddress } from '../../db/addresses';

// Add ScyllaDB client
let scyllaClient: Client | null = null;

async function getScyllaClient(): Promise<Client> {
  if (scyllaClient) return scyllaClient;
  
  logger.info('Connecting to ScyllaDB...');
  scyllaClient = await initScyllaClient();
  return scyllaClient;
}

export async function processEthereumTransaction(job: Job): Promise<void> {
  const { blockNumber, hash } = job.data;
  const logPrefix = `[Ethereum Tx ${hash}]`;
  
  logger.debug(`${logPrefix} Processing`);
  
  try {
    const db = await getDbConnection();
    const provider = getProvider();
    const scyllaClient = await getScyllaClient();
    
    // Check if transaction already exists
    const existingTx = await db.collection('transactions').findOne({
      blockchain: 'ethereum',
      hash: normalizeHex(hash)
    });
    
    if (existingTx) {
      logger.debug(`${logPrefix} Already processed, skipping`);
      return;
    }
    
    // Fetch transaction data
    const tx = await provider.getTransaction(hash);
    if (!tx) {
      logger.warn(`${logPrefix} Transaction not found`);
      return;
    }
    
    // Get block for timestamp
    const block = await provider.getBlock(blockNumber);
    const timestamp = block ? new Date(Number(block.timestamp) * 1000) : new Date();
    
    // Store transaction in database
    const txData = {
      blockchain: 'ethereum',
      hash: normalizeHex(tx.hash),
      blockNumber: blockNumber,
      from: normalizeHex(tx.from),
      to: tx.to ? normalizeHex(tx.to) : null,
      value: tx.value.toString(),
      timestamp,
      createdAt: new Date()
    };
    
    await db.collection('transactions').updateOne(
      { blockchain: 'ethereum', hash: normalizeHex(tx.hash) },
      { $set: txData },
      { upsert: true }
    );
    
    // Store addresses
    await storeAddress(db, tx.from, 'ethereum');
    if (tx.to) {
      await storeAddress(db, tx.to, 'ethereum');
    }
    
    // Add to global indexes (ScyllaDB)
    await indexAddressGlobally(scyllaClient, tx.from, 'ethereum', timestamp);
    if (tx.to) {
      await indexAddressGlobally(scyllaClient, tx.to, 'ethereum', timestamp);
    }
    
    await indexTransactionGlobally(
      scyllaClient,
      tx.hash,
      'ethereum',
      blockNumber,
      tx.from,
      tx.to,
      timestamp
    );
    
    logger.debug(`${logPrefix} Saved to database and global index`);
  } catch (error) {
    logger.error(`${logPrefix} Error: ${error instanceof Error ? error.message : String(error)}`);
    throw error;
  }
} 