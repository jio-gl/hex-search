import { Client } from 'cassandra-driver';
import { createLogger } from '../utils/logger';
import { config } from '../config';

const logger = createLogger('cross-chain-search');

// Interface for search options
interface CrossChainSearchOptions {
  limit: number;
  offset: number;
  type?: string;
  chains?: string[]; // Optional array to limit to specific chains
}

// Interface for address result
interface AddressResult {
  address: string;
  blockchains: string[];
  firstSeen: Date;
  lastSeen: Date;
  txCount: number;
}

// Interface for transaction result
interface TransactionResult {
  txHash: string;
  blockchain: string;
  blockNumber: number;
  fromAddress: string | null;
  toAddress: string | null;
  timestamp: Date;
}

// Interface for combined search results
interface CrossChainSearchResult {
  addresses: AddressResult[];
  transactions: TransactionResult[];
}

// Cross-chain search service
export const crossChainSearchService = {
  /**
   * Search for addresses across all chains using one or more fragments
   */
  async searchAddressFragments(
    fragments: string[],
    options: CrossChainSearchOptions,
    dbClient: Client,
    redisClient: any | null
  ): Promise<CrossChainSearchResult> {
    try {
      const cacheKey = `cross-chain:${fragments.join('+')}:${JSON.stringify(options)}`;
      
      // Try to get from cache first
      if (redisClient) {
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
          logger.debug(`Cache hit for cross-chain search: ${cacheKey}`);
          return JSON.parse(cachedResults);
        }
      }

      // Normalize all fragments to lowercase
      const normalizedFragments = fragments.map(f => f.toLowerCase());
      
      // Find addresses that contain all fragments
      const addresses = await this.findAddressesWithAllFragments(
        normalizedFragments,
        options,
        dbClient
      );
      
      if (addresses.length === 0) {
        return { addresses: [], transactions: [] };
      }
      
      // Find transactions involving these addresses
      const transactions = await this.findTransactionsForAddresses(
        addresses.map(a => a.address),
        options,
        dbClient
      );
      
      const result = { addresses, transactions };
      
      // Cache the results
      if (redisClient) {
        await redisClient.set(
          cacheKey,
          JSON.stringify(result),
          'EX',
          config.redis.ttl
        );
        logger.debug(`Cached cross-chain search results for: ${cacheKey}`);
      }
      
      return result;
    } catch (error) {
      logger.error(`Cross-chain search error: ${error}`);
      throw error;
    }
  },
  
  /**
   * Find addresses that contain all the specified fragments
   */
  async findAddressesWithAllFragments(
    fragments: string[],
    options: CrossChainSearchOptions,
    dbClient: Client
  ): Promise<AddressResult[]> {
    if (fragments.length === 0) {
      return [];
    }
    
    try {
      const addressMap = new Map<string, Set<string>>();
      
      // Optimization: Start with searching the first fragment to get initial candidates
      const firstFragment = fragments[0];
      
      // For single fragment case, use the optimized fragment index
      if (fragments.length === 1 && firstFragment.length <= 8) {
        const fragmentQuery = `
          SELECT address, blockchain FROM hexsearch.address_fragments 
          WHERE fragment LIKE ? LIMIT ?
        `;
        
        const fragmentParams = [`%${firstFragment}%`, options.limit * 10]; // Get more initially to filter
        const fragmentResults = await dbClient.execute(fragmentQuery, fragmentParams, { prepare: true });
        
        for (const row of fragmentResults.rows) {
          const key = row.address;
          if (!addressMap.has(key)) {
            addressMap.set(key, new Set());
          }
          addressMap.get(key)!.add(row.blockchain);
        }
      } 
      // For larger fragments or multiple fragments, query the global address index
      else {
        const query = `
          SELECT address, blockchain FROM hexsearch.global_address_index 
          WHERE address LIKE ? ${options.chains ? 'AND blockchain IN ?' : ''} 
          LIMIT ? ALLOW FILTERING
        `;
        
        const params = options.chains ? 
          [`%${firstFragment}%`, options.chains, options.limit * 10] : 
          [`%${firstFragment}%`, options.limit * 10];
        
        const results = await dbClient.execute(query, params, { prepare: true });
        
        for (const row of results.rows) {
          const key = row.address;
          if (!addressMap.has(key)) {
            addressMap.set(key, new Set());
          }
          addressMap.get(key)!.add(row.blockchain);
        }
      }
      
      // Filter addresses that contain all fragments
      const matchingAddresses: string[] = [];
      
      for (const [address, chains] of addressMap.entries()) {
        let containsAllFragments = true;
        
        // Skip first fragment since we already used it for initial query
        for (let i = 1; i < fragments.length; i++) {
          if (!address.includes(fragments[i])) {
            containsAllFragments = false;
            break;
          }
        }
        
        if (containsAllFragments) {
          matchingAddresses.push(address);
        }
      }
      
      if (matchingAddresses.length === 0) {
        return [];
      }
      
      // Get full address details for matches
      const addressDetailsQuery = `
        SELECT address, blockchain, first_seen, last_seen, tx_count 
        FROM hexsearch.global_address_index 
        WHERE address IN ? ${options.chains ? 'AND blockchain IN ?' : ''}
      `;
      
      const addressDetailsParams = options.chains ? 
        [matchingAddresses, options.chains] : 
        [matchingAddresses];
      
      const detailsResults = await dbClient.execute(
        addressDetailsQuery, 
        addressDetailsParams, 
        { prepare: true }
      );
      
      // Group results by address
      const addressDetails = new Map<string, AddressResult>();
      
      for (const row of detailsResults.rows) {
        const key = row.address;
        
        if (!addressDetails.has(key)) {
          addressDetails.set(key, {
            address: key,
            blockchains: [],
            firstSeen: row.first_seen,
            lastSeen: row.last_seen,
            txCount: Number(row.tx_count) // Counter is returned as string
          });
        }
        
        addressDetails.get(key)!.blockchains.push(row.blockchain);
      }
      
      return Array.from(addressDetails.values())
        .slice(options.offset, options.offset + options.limit);
    } catch (error) {
      logger.error(`Error finding addresses with fragments: ${error}`);
      throw error;
    }
  },
  
  /**
   * Find transactions that involve the given addresses
   */
  async findTransactionsForAddresses(
    addresses: string[],
    options: CrossChainSearchOptions,
    dbClient: Client
  ): Promise<TransactionResult[]> {
    if (addresses.length === 0) {
      return [];
    }
    
    try {
      // Query for transactions where addresses are sender or receiver
      const txQuery = `
        SELECT tx_hash, blockchain, block_number, from_address, to_address, timestamp 
        FROM hexsearch.global_transaction_index 
        WHERE (from_address IN ? OR to_address IN ?) 
        ${options.chains ? 'AND blockchain IN ?' : ''}
        LIMIT ? ALLOW FILTERING
      `;
      
      const txParams = options.chains ? 
        [addresses, addresses, options.chains, options.limit * 2] : 
        [addresses, addresses, options.limit * 2];
      
      const results = await dbClient.execute(txQuery, txParams, { prepare: true });
      
      return results.rows.map(row => ({
        txHash: row.tx_hash,
        blockchain: row.blockchain,
        blockNumber: row.block_number,
        fromAddress: row.from_address,
        toAddress: row.to_address,
        timestamp: row.timestamp
      })).slice(0, options.limit);
    } catch (error) {
      logger.error(`Error finding transactions for addresses: ${error}`);
      throw error;
    }
  },
  
  /**
   * Get all supported blockchains
   */
  async getSupportedBlockchains(dbClient: Client): Promise<string[]> {
    try {
      const query = `
        SELECT DISTINCT blockchain FROM hexsearch.global_address_index LIMIT 1000
      `;
      
      const results = await dbClient.execute(query);
      return results.rows.map(row => row.blockchain);
    } catch (error) {
      logger.error(`Error getting supported blockchains: ${error}`);
      throw error;
    }
  }
}; 