import { Client } from 'cassandra-driver';
import { config } from '../config';
import { createLogger } from '../utils/logger';
import { createGlobalIndexSchema } from './schema/global-index';

const logger = createLogger('db-init');

/**
 * Initialize the database schema
 * Creates keyspace and tables if they don't exist
 */
export async function initializeDatabase(): Promise<void> {
  // First connect without keyspace to create it if needed
  const client = new Client({
    contactPoints: config.scylla.contactPoints,
    localDataCenter: config.scylla.localDataCenter,
  });

  try {
    await client.connect();
    logger.info('Connected to ScyllaDB cluster');

    // Create keyspace if it doesn't exist
    await client.execute(`
      CREATE KEYSPACE IF NOT EXISTS ${config.scylla.keyspace}
      WITH replication = {
        'class': 'SimpleStrategy',
        'replication_factor': 1
      }
    `);

    logger.info(`Keyspace ${config.scylla.keyspace} ensured`);

    // Disconnect and reconnect with keyspace
    await client.shutdown();

    // Create new client with keyspace
    const keyspaceClient = new Client({
      contactPoints: config.scylla.contactPoints,
      localDataCenter: config.scylla.localDataCenter,
      keyspace: config.scylla.keyspace,
    });

    await keyspaceClient.connect();
    logger.info(`Connected to keyspace ${config.scylla.keyspace}`);

    // Create schema
    await createGlobalIndexSchema(keyspaceClient);

    // Disconnect
    await keyspaceClient.shutdown();
    logger.info('Database initialization complete');
  } catch (error) {
    logger.error('Error initializing database:', error);
    throw error;
  } finally {
    // Ensure client is shut down in case of error
    if (client.connected) {
      await client.shutdown();
    }
  }
} 