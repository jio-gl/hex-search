import express from 'express';
import { logger } from './utils/logger';
import { initializeDatabase } from './db/init';
import { configureCors } from './middleware/cors';
import { searchRouter } from './routes/search';

const app = express();
const port = process.env.PORT || 3001;

// Configure CORS
configureCors(app);

// Parse JSON bodies
app.use(express.json());

// Routes
app.use('/api', searchRouter);

// Initialize database and start server
const start = async () => {
  try {
    await initializeDatabase();
    app.listen(port, () => {
      logger.info(`Query service listening on port ${port}`);
    });
  } catch (error) {
    logger.error('Failed to start server:', error);
    process.exit(1);
  }
};

start();
