import { Client, types } from 'cassandra-driver';
import { createLogger } from '../utils/logger';
import { config } from '../config';

const logger = createLogger('scylla-client');

// Contact points for ScyllaDB cluster
const contactPoints = config.scylla.hosts;
const localDataCenter = config.scylla.datacenter;
const keyspace = config.scylla.keyspace;

// ScyllaDB client
let scyllaClient: Client | null = null;

/**
 * Initialize ScyllaDB client
 */
export const initScyllaClient = async (): Promise<Client> => {
  if (scyllaClient) {
    return scyllaClient;
  }

  try {
    logger.info(`Connecting to ScyllaDB at ${contactPoints.join(', ')}...`);
    
    // Create ScyllaDB client
    scyllaClient = new Client({
      contactPoints,
      localDataCenter,
      keyspace,
      pooling: {
        coreConnectionsPerHost: {
          [types.distance.local]: 8,
          [types.distance.remote]: 2
        }
      },
      queryOptions: {
        consistency: types.consistencies.localQuorum
      }
    });

    // Connect to database
    await scyllaClient.connect();
    logger.info('Connected to ScyllaDB');
    
    // Create keyspace and tables if needed
    await initializeSchema(scyllaClient);
    
    return scyllaClient;
  } catch (error) {
    logger.error('Failed to connect to ScyllaDB:', error);
    throw error;
  }
};

/**
 * Create schema (keyspace and tables)
 */
async function initializeSchema(client: Client): Promise<void> {
  try {
    // Check if keyspace exists
    const keyspaceQuery = `
      SELECT keyspace_name 
      FROM system_schema.keyspaces 
      WHERE keyspace_name = ?
    `;
    
    const keyspaceResult = await client.execute(keyspaceQuery, [keyspace], {
      prepare: true
    });
    
    // Create keyspace if it doesn't exist
    if (keyspaceResult.rows.length === 0) {
      logger.info(`Creating keyspace ${keyspace}...`);
      
      const createKeyspaceQuery = `
        CREATE KEYSPACE IF NOT EXISTS ${keyspace} 
        WITH replication = {
          'class': 'NetworkTopologyStrategy', 
          '${localDataCenter}': 3
        } 
        AND durable_writes = true
      `;
      
      await client.execute(createKeyspaceQuery);
      logger.info(`Created keyspace ${keyspace}`);
    }
    
    // Create tables
    await createBlocksTable(client);
    await createTransactionsTable(client);
    await createAddressesTable(client);
    
    // Create SASI indexes for substring search
    await createSubstringIndexes(client);
    
    logger.info('Schema initialization complete');
  } catch (error) {
    logger.error('Error initializing schema:', error);
    throw error;
  }
}

/**
 * Create blocks table
 */
async function createBlocksTable(client: Client): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${keyspace}.blocks (
      blockchain text,
      number bigint,
      hash text,
      parent_hash text,
      timestamp timestamp,
      created_at timestamp,
      PRIMARY KEY ((blockchain, number), hash)
    )
  `;
  
  await client.execute(query);
  logger.info('Created blocks table');
  
  // Create index on hash for exact lookup
  const indexQuery = `
    CREATE INDEX IF NOT EXISTS blocks_hash_idx 
    ON ${keyspace}.blocks (hash)
  `;
  
  await client.execute(indexQuery);
  logger.info('Created index on blocks.hash');
}

/**
 * Create transactions table
 */
async function createTransactionsTable(client: Client): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${keyspace}.transactions (
      blockchain text,
      hash text,
      block_number bigint,
      from_address text,
      to_address text,
      value text,
      timestamp timestamp,
      created_at timestamp,
      PRIMARY KEY ((blockchain, hash))
    )
  `;
  
  await client.execute(query);
  logger.info('Created transactions table');
  
  // Create secondary indexes
  const fromIndexQuery = `
    CREATE INDEX IF NOT EXISTS tx_from_idx 
    ON ${keyspace}.transactions (from_address)
  `;
  
  const toIndexQuery = `
    CREATE INDEX IF NOT EXISTS tx_to_idx 
    ON ${keyspace}.transactions (to_address)
  `;
  
  const blockIndexQuery = `
    CREATE INDEX IF NOT EXISTS tx_block_idx 
    ON ${keyspace}.transactions (block_number)
  `;
  
  await Promise.all([
    client.execute(fromIndexQuery),
    client.execute(toIndexQuery),
    client.execute(blockIndexQuery)
  ]);
  
  logger.info('Created indexes on transactions table');
}

/**
 * Create addresses table
 */
async function createAddressesTable(client: Client): Promise<void> {
  const query = `
    CREATE TABLE IF NOT EXISTS ${keyspace}.addresses (
      blockchain text,
      address text,
      created_at timestamp,
      updated_at timestamp,
      PRIMARY KEY ((blockchain, address))
    )
  `;
  
  await client.execute(query);
  logger.info('Created addresses table');
  
  // Create TTL stats table for address activity
  const statsQuery = `
    CREATE TABLE IF NOT EXISTS ${keyspace}.address_stats (
      blockchain text,
      address text,
      day date,
      tx_count counter,
      PRIMARY KEY ((blockchain, address), day)
    )
  `;
  
  await client.execute(statsQuery);
  logger.info('Created address_stats table');
}

/**
 * Create SASI indexes for substring search
 */
async function createSubstringIndexes(client: Client): Promise<void> {
  try {
    // SASI index for blocks hash
    const blocksSasiQuery = `
      CREATE CUSTOM INDEX IF NOT EXISTS blocks_hash_sasi 
      ON ${keyspace}.blocks (hash) 
      USING 'org.apache.cassandra.index.sasi.SASIIndex'
      WITH OPTIONS = {
        'mode': 'CONTAINS',
        'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
        'case_sensitive': 'false'
      }
    `;
    
    // SASI index for transactions hash
    const txSasiQuery = `
      CREATE CUSTOM INDEX IF NOT EXISTS tx_hash_sasi 
      ON ${keyspace}.transactions (hash) 
      USING 'org.apache.cassandra.index.sasi.SASIIndex'
      WITH OPTIONS = {
        'mode': 'CONTAINS',
        'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
        'case_sensitive': 'false'
      }
    `;
    
    // SASI index for addresses
    const addrSasiQuery = `
      CREATE CUSTOM INDEX IF NOT EXISTS addr_address_sasi 
      ON ${keyspace}.addresses (address) 
      USING 'org.apache.cassandra.index.sasi.SASIIndex'
      WITH OPTIONS = {
        'mode': 'CONTAINS',
        'analyzer_class': 'org.apache.cassandra.index.sasi.analyzer.NonTokenizingAnalyzer',
        'case_sensitive': 'false'
      }
    `;
    
    await Promise.all([
      client.execute(blocksSasiQuery),
      client.execute(txSasiQuery),
      client.execute(addrSasiQuery)
    ]);
    
    logger.info('Created SASI indexes for substring search');
  } catch (error) {
    // SASI might not be available in all ScyllaDB versions
    // Fall back to SAI if available
    logger.warn('SASI indexes not supported, trying SAI indexes:', error);
    await createSAIIndexes(client);
  }
}

/**
 * Create SAI indexes (Storage-Attached Indexing) as fallback
 */
async function createSAIIndexes(client: Client): Promise<void> {
  try {
    // SAI index for blocks hash
    const blocksSaiQuery = `
      CREATE INDEX IF NOT EXISTS blocks_hash_sai 
      ON ${keyspace}.blocks (hash)
    `;
    
    // SAI index for transactions hash
    const txSaiQuery = `
      CREATE INDEX IF NOT EXISTS tx_hash_sai 
      ON ${keyspace}.transactions (hash)
    `;
    
    // SAI index for addresses
    const addrSaiQuery = `
      CREATE INDEX IF NOT EXISTS addr_address_sai 
      ON ${keyspace}.addresses (address)
    `;
    
    await Promise.all([
      client.execute(blocksSaiQuery),
      client.execute(txSaiQuery),
      client.execute(addrSaiQuery)
    ]);
    
    logger.info('Created SAI indexes for substring search');
  } catch (error) {
    logger.error('Failed to create indexes for substring search:', error);
    logger.warn('Substring search might be slower without proper indexes');
  }
}

/**
 * Shutdown ScyllaDB client
 */
export const closeScyllaClient = async (): Promise<void> => {
  if (scyllaClient) {
    await scyllaClient.shutdown();
    scyllaClient = null;
    logger.info('ScyllaDB client closed');
  }
}; 