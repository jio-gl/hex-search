import 'dotenv/config';
import express from 'express';
import { createLogger } from './utils/logger';
import { config } from './config';
import { initializeDatabase } from './db/init';
import crossChainRouter from './api/cross-chain';

const logger = createLogger('app');
const app = express();

// Middleware
app.use(express.json());

// Routes
app.use('/api/cross-chain', crossChainRouter);

// Error handler
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

async function startServer() {
  try {
    // Initialize database
    await initializeDatabase();
    
    // Start server
    app.listen(config.api.port, config.api.host, () => {
      logger.info(`Server running at http://${config.api.host}:${config.api.port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Start the server
startServer(); 