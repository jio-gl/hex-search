import { Router, Request, Response, NextFunction } from 'express';
import { crossChainSearchService } from '../services/cross-chain-search';
import { createLogger } from '../utils/logger';
import { withScyllaDB } from './middleware';

const router = Router();
const logger = createLogger('cross-chain-api');

// Apply middleware to all routes
router.use(withScyllaDB);

/**
 * Endpoint to search across all chains using address fragments
 * GET /api/cross-chain/search?fragments=06E3,13D0&limit=10&offset=0&chains=ethereum,polygon
 */
router.get('/search', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { 
      fragments, 
      limit = '10', 
      offset = '0',
      type,
      chains
    } = req.query;

    if (!fragments || typeof fragments !== 'string') {
      return res.status(400).json({
        error: 'Address fragments are required (comma or space separated)'
      });
    }

    // Parse fragments - support both comma and space separated formats
    const fragmentList = fragments.split(/[,\s]+/).filter(Boolean);
    
    if (fragmentList.length === 0) {
      return res.status(400).json({
        error: 'At least one address fragment is required'
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

    // Parse optional chains parameter
    const chainList = typeof chains === 'string' ? 
      chains.split(',').filter(Boolean) : 
      undefined;
    
    // Build search options
    const options = {
      limit: parsedLimit,
      offset: parsedOffset,
      type: typeof type === 'string' ? type : undefined,
      chains: chainList
    };

    // Log search query
    logger.info(`Cross-chain search fragments: ${fragmentList.join(', ')}, options: ${JSON.stringify(options)}`);

    // Perform search
    const results = await crossChainSearchService.searchAddressFragments(
      fragmentList,
      options,
      scyllaClient,
      redisClient
    );

    // Return results
    res.json({
      fragments: fragmentList,
      addressCount: results.addresses.length,
      transactionCount: results.transactions.length,
      results
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get list of all supported blockchains
 * GET /api/cross-chain/chains
 */
router.get('/chains', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { scyllaClient } = req.app.locals;
    
    const chains = await crossChainSearchService.getSupportedBlockchains(scyllaClient);
    
    res.json({
      count: chains.length,
      chains
    });
  } catch (error) {
    next(error);
  }
});

/**
 * Get transactions involving an address across all chains
 * GET /api/cross-chain/address/:address/transactions?limit=10&offset=0&chains=ethereum,polygon
 */
router.get('/address/:address/transactions', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { address } = req.params;
    const { 
      limit = '10', 
      offset = '0',
      chains
    } = req.query;
    
    if (!address) {
      return res.status(400).json({
        error: 'Address is required'
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
    
    const { scyllaClient, redisClient } = req.app.locals;
    
    // Parse optional chains parameter
    const chainList = typeof chains === 'string' ? 
      chains.split(',').filter(Boolean) : 
      undefined;
    
    // Build search options
    const options = {
      limit: parsedLimit,
      offset: parsedOffset,
      chains: chainList
    };
    
    // Get address details first
    const addressResults = await crossChainSearchService.findAddressesWithAllFragments(
      [address.toLowerCase()], // Exact match with full address
      { ...options, limit: 1, offset: 0 },
      scyllaClient
    );
    
    if (addressResults.length === 0) {
      return res.status(404).json({
        error: 'Address not found'
      });
    }
    
    // Then get transactions
    const transactions = await crossChainSearchService.findTransactionsForAddresses(
      [address.toLowerCase()],
      options,
      scyllaClient
    );
    
    res.json({
      address: address.toLowerCase(),
      addressDetails: addressResults[0],
      transactionCount: transactions.length,
      transactions
    });
  } catch (error) {
    next(error);
  }
});

export default router; 