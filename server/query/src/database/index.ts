import { Client } from 'cassandra-driver';
import { createClient } from 'redis';
import { logger } from '../utils/logger';
import { initializeDatabase } from './init';

// Cassandra client
export const cassandraClient = new Client({
  contactPoints: [process.env.CASSANDRA_HOST || 'localhost'],
  localDataCenter: 'datacenter1',
  keyspace: 'hex_search',
});

// Redis client
export const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
});

export async function setupDatabase() {
  try {
    // Initialize the database if needed
    await initializeDatabase();
    
    // Connect to Cassandra
    await cassandraClient.connect();
    logger.info('Connected to Cassandra');

    // Connect to Redis
    await redisClient.connect();
    logger.info('Connected to Redis');
  } catch (error) {
    logger.error('Database connection error:', error);
    process.exit(1);
  }
} 