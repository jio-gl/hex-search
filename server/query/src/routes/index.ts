import { Express } from 'express';
import { searchRouter } from './search';

export function setupRoutes(app: Express) {
  // Health check endpoint
  app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
  });

  // API routes
  app.use('/api/search', searchRouter);
} 