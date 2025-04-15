import express from 'express';
import { searchService } from '../services/search';
import { createLogger } from '../utils/logger';
import { normalizeHex, isValidHex } from '../utils/hexUtils';
import { initScyllaClient } from '../db/scylla';

const router = express.Router();
const logger = createLogger('search-api');

// Middleware to ensure ScyllaDB client is available
const withScyllaDB = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
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

// Apply middleware to all routes
router.use(withScyllaDB);

// Search endpoint
router.get('/', async (req, res, next) => {
  try {
    const { 
      q, 
      limit = '10', 
      offset = '0', 
      type, 
      blockchain,
      exact = 'false' // New parameter for exact vs substring matching
    } = req.query;

    if (!q || typeof q !== 'string') {
      return res.status(400).json({
        error: 'Search query is required'
      });
    }

    // For substring search, we allow non-hex characters
    // Only validate hex for exact searches
    if (exact === 'true' && !isValidHex(q)) {
      return res.status(400).json({
        error: 'Search query must be a valid hexadecimal string for exact matches'
      });
    }

    // For substring search, just normalize to lowercase without 0x prefix
    const normalizedQuery = exact === 'true' ? normalizeHex(q) : q.toLowerCase();
    
    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);
    
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        error: 'Limit must be a number between 1 and 100'
      });
    }
    
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        error: 'Offset must be a non-negative number'
      });
    }

    // Get clients from app locals
    const { scyllaClient, redisClient } = req.app.locals;

    // Build search options
    const options = {
      limit: parsedLimit,
      offset: parsedOffset,
      type: type as string | undefined,
      blockchain: blockchain as string | undefined,
      exact: exact === 'true'
    };

    // Log search query
    logger.info(`Search query: ${normalizedQuery}, options: ${JSON.stringify(options)}`);

    // Perform search
    const results = await searchService.search(
      normalizedQuery,
      options,
      scyllaClient,
      redisClient
    );

    // Return results
    res.json({
      query: normalizedQuery,
      count: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
});

// Get details for a specific hash
router.get('/:hash', async (req, res, next) => {
  try {
    const { hash } = req.params;
    const { type } = req.query;

    if (!hash || !isValidHex(hash)) {
      return res.status(400).json({
        error: 'Valid hexadecimal hash is required'
      });
    }

    const normalizedHash = normalizeHex(hash);
    const { scyllaClient, redisClient } = req.app.locals;

    // Get details for the hash
    const result = await searchService.getDetails(
      normalizedHash,
      type as string | undefined,
      scyllaClient,
      redisClient
    );

    if (!result) {
      return res.status(404).json({
        error: 'Item not found'
      });
    }

    res.json(result);
  } catch (error) {
    next(error);
  }
});

// Search by multiple patterns (simplified route for clearer API)
router.get('/multi/:patterns', async (req, res, next) => {
  try {
    const { patterns } = req.params;
    const { 
      limit = '10', 
      offset = '0', 
      type, 
      blockchain
    } = req.query;

    if (!patterns) {
      return res.status(400).json({
        error: 'Search patterns are required'
      });
    }

    const parsedLimit = parseInt(limit as string, 10);
    const parsedOffset = parseInt(offset as string, 10);
    
    // Validate params
    if (isNaN(parsedLimit) || parsedLimit < 1 || parsedLimit > 100) {
      return res.status(400).json({
        error: 'Limit must be a number between 1 and 100'
      });
    }
    
    if (isNaN(parsedOffset) || parsedOffset < 0) {
      return res.status(400).json({
        error: 'Offset must be a non-negative number'
      });
    }

    // Get clients from app locals
    const { scyllaClient, redisClient } = req.app.locals;

    // Build search options
    const options = {
      limit: parsedLimit,
      offset: parsedOffset,
      type: type as string | undefined,
      blockchain: blockchain as string | undefined,
      exact: false // Always substring search in this route
    };

    // Log search query
    logger.info(`Multi-pattern search: ${patterns}, options: ${JSON.stringify(options)}`);

    // Perform search
    const results = await searchService.search(
      patterns.toLowerCase(),
      options,
      scyllaClient,
      redisClient
    );

    // Return results
    res.json({
      patterns: patterns.split(/\s+/),
      count: results.length,
      results
    });
  } catch (error) {
    next(error);
  }
});

export default router; 