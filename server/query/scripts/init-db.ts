import { initializeDatabase } from '../src/database/init';
import { logger } from '../src/utils/logger';

async function main() {
  try {
    await initializeDatabase();
    logger.info('Database initialization completed successfully');
    process.exit(0);
  } catch (error) {
    logger.error('Database initialization failed:', error);
    process.exit(1);
  }
}

main(); 