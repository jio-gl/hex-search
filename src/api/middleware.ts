import { Request, Response, NextFunction } from 'express';
import { initScyllaClient } from '../db/scylla';
import { createLogger } from '../utils/logger';

const logger = createLogger('api-middleware');

/**
 * Middleware to ensure ScyllaDB client is available
 */
export const withScyllaDB = async (
  req: Request, 
  res: Response, 
  next: NextFunction
) => {
  try {
    if (!req.app.locals.scyllaClient) {
      req.app.locals.scyllaClient = await initScyllaClient();
    }
    next();
  } catch (error) {
    logger.error('Failed to initialize ScyllaDB client:', error);
    next(error);
  }
}; 