import { Client } from 'cassandra-driver';
import { logger } from '../utils/logger';

async function initializeDatabase() {
  // Create a client without specifying a keyspace
  const client = new Client({
    contactPoints: [process.env.CASSANDRA_HOST || 'localhost'],
    localDataCenter: 'datacenter1',
  });

  try {
    // Connect to Cassandra
    await client.connect();
    logger.info('Connected to Cassandra');

    // Create keyspace if it doesn't exist
    await client.execute(`
      CREATE KEYSPACE IF NOT EXISTS hex_search
      WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `);
    logger.info('Created keyspace hex_search');

    // Use the keyspace
    await client.execute('USE hex_search');

    // Create transactions table
    await client.execute(`
      CREATE TABLE IF NOT EXISTS transactions (
        id uuid PRIMARY KEY,
        blockchain text,
        block_number bigint,
        block_hash text,
        transaction_hash text,
        hex_data text,
        timestamp timestamp
      )
    `);
    logger.info('Created transactions table');

    // Create index on blockchain and hex_data
    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_blockchain ON transactions (blockchain)
    `);
    logger.info('Created index on blockchain');

    await client.execute(`
      CREATE INDEX IF NOT EXISTS idx_hex_data ON transactions (hex_data)
    `);
    logger.info('Created index on hex_data');

    logger.info('Database initialization completed successfully');
  } catch (error) {
    logger.error('Database initialization error:', error);
    throw error;
  } finally {
    await client.shutdown();
  }
}

// Run the initialization if this script is executed directly
if (require.main === module) {
  initializeDatabase()
    .then(() => {
      logger.info('Database initialization completed');
      process.exit(0);
    })
    .catch((error) => {
      logger.error('Database initialization failed:', error);
      process.exit(1);
    });
}

export { initializeDatabase }; 