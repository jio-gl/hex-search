import { Client } from 'cassandra-driver';
import { createLogger } from '../../utils/logger';

const logger = createLogger('global-index-schema');

/**
 * Creates tables and indexes for cross-chain searching
 * This enables searching across all chains without specifying the blockchain
 */
export async function createGlobalIndexSchema(client: Client): Promise<void> {
  try {
    logger.info('Creating global index tables for cross-chain search...');
    
    // Create global address index table
    // This table contains all addresses across all chains with references to original data
    await client.execute(`
      CREATE TABLE IF NOT EXISTS hexsearch.global_address_index (
        address text,
        blockchain text,
        first_seen timestamp,
        last_seen timestamp,
        tx_count counter,
        PRIMARY KEY (address, blockchain)
      )
    `);
    
    // Create SASI index on address for substring searching across all chains
    try {
      await client.execute(`
        CREATE CUSTOM INDEX IF NOT EXISTS global_addr_sasi 
        ON hexsearch.global_address_index (address) 
        USING 'org.apache.cassandra.index.sasi.SASIIndex'
        WITH OPTIONS = {
          'mode': 'CONTAINS',
          'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
          'case_sensitive': 'false'
        }
      `);
    } catch (error) {
      logger.warn('SASI index not supported, falling back to SAI index:', error);
      
      // Fall back to SAI (Storage Attached Index) if SASI is not supported
      await client.execute(`
        CREATE INDEX IF NOT EXISTS global_addr_sai 
        ON hexsearch.global_address_index (address)
      `);
    }
    
    // Create global transaction index that references transactions across all chains
    await client.execute(`
      CREATE TABLE IF NOT EXISTS hexsearch.global_transaction_index (
        tx_hash text,
        blockchain text,
        block_number bigint,
        from_address text,
        to_address text,
        timestamp timestamp,
        PRIMARY KEY (tx_hash, blockchain)
      )
    `);
    
    // Create index on from_address and to_address for quick address-based lookups
    await client.execute(`
      CREATE INDEX IF NOT EXISTS global_tx_from_idx 
      ON hexsearch.global_transaction_index (from_address)
    `);
    
    await client.execute(`
      CREATE INDEX IF NOT EXISTS global_tx_to_idx 
      ON hexsearch.global_transaction_index (to_address)
    `);
    
    // Create address fragment lookup table optimized for fragment searches
    // This table breaks addresses into fragments with references back to full addresses
    await client.execute(`
      CREATE TABLE IF NOT EXISTS hexsearch.address_fragments (
        fragment text,
        address text,
        blockchain text,
        PRIMARY KEY (fragment, address, blockchain)
      )
    `);
    
    // Create SASI index on fragment for efficient substring matching
    try {
      await client.execute(`
        CREATE CUSTOM INDEX IF NOT EXISTS fragment_sasi 
        ON hexsearch.address_fragments (fragment) 
        USING 'org.apache.cassandra.index.sasi.SASIIndex'
        WITH OPTIONS = {
          'mode': 'CONTAINS',
          'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
          'case_sensitive': 'false'
        }
      `);
    } catch (error) {
      logger.warn('SASI index not supported for fragments, falling back to SAI index:', error);
      
      await client.execute(`
        CREATE INDEX IF NOT EXISTS fragment_sai 
        ON hexsearch.address_fragments (fragment)
      `);
    }
    
    logger.info('Global index tables and indexes created successfully');
  } catch (error) {
    logger.error('Error creating global index schema:', error);
    throw error;
  }
}

/**
 * Indexes an address into the global index and generates fragments
 * This function should be called whenever a new address is encountered
 */
export async function indexAddressGlobally(
  client: Client, 
  address: string, 
  blockchain: string,
  timestamp: Date
): Promise<void> {
  try {
    // Normalize address to lowercase
    const normalizedAddress = address.toLowerCase();
    
    // Update global address index
    await client.execute(
      `UPDATE hexsearch.global_address_index 
       SET last_seen = ?, tx_count = tx_count + 1 
       WHERE address = ? AND blockchain = ?`,
      [timestamp, normalizedAddress, blockchain],
      { prepare: true }
    );
    
    // First time seeing this address
    await client.execute(
      `UPDATE hexsearch.global_address_index 
       SET first_seen = ? 
       WHERE address = ? AND blockchain = ? 
       IF first_seen = null`,
      [timestamp, normalizedAddress, blockchain],
      { prepare: true }
    );
    
    // Generate and store address fragments (in chunks of 8 chars with 4 char overlap)
    // This optimizes for fragment searches
    const fragmentSize = 8;
    const overlapSize = 4;
    
    for (let i = 0; i < normalizedAddress.length - fragmentSize + 1; i += overlapSize) {
      const fragment = normalizedAddress.substring(i, i + fragmentSize);
      
      await client.execute(
        `INSERT INTO hexsearch.address_fragments (fragment, address, blockchain)
         VALUES (?, ?, ?)`,
        [fragment, normalizedAddress, blockchain],
        { prepare: true }
      );
    }
  } catch (error) {
    logger.error(`Error indexing address ${address} globally:`, error);
    throw error;
  }
}

/**
 * Indexes a transaction into the global transaction index
 * This should be called whenever a new transaction is processed
 */
export async function indexTransactionGlobally(
  client: Client,
  txHash: string,
  blockchain: string,
  blockNumber: number,
  fromAddress: string | null,
  toAddress: string | null,
  timestamp: Date
): Promise<void> {
  try {
    // Add to global transaction index
    await client.execute(
      `INSERT INTO hexsearch.global_transaction_index 
       (tx_hash, blockchain, block_number, from_address, to_address, timestamp)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [
        txHash.toLowerCase(), 
        blockchain, 
        blockNumber, 
        fromAddress ? fromAddress.toLowerCase() : null, 
        toAddress ? toAddress.toLowerCase() : null, 
        timestamp
      ],
      { prepare: true }
    );
  } catch (error) {
    logger.error(`Error indexing transaction ${txHash} globally:`, error);
    throw error;
  }
} 