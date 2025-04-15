import { Client } from 'cassandra-driver';
import Redis from 'ioredis';
import { createLogger } from '../utils/logger';
import { normalizeHex } from '../utils/hexUtils';
import { config } from '../config';

const logger = createLogger('search-service');

interface SearchOptions {
  limit: number;
  offset: number;
  type?: string;
  blockchain?: string;
  exact?: boolean;
}

interface SearchResult {
  id: string;
  hash: string;
  type: string;
  blockchain: string;
  blockNumber?: number;
  timestamp: Date;
  [key: string]: any;
}

const getCacheKey = (query: string, options: SearchOptions): string => {
  return `search:${query}:${JSON.stringify(options)}`;
};

const parseSubstringPatterns = (query: string): string[] => {
  return query.split(/\s+/).filter(pattern => pattern.length > 0);
};

export const searchService = {
  async search(
    query: string,
    options: SearchOptions,
    dbClient: Client,
    redisClient: Redis | null
  ): Promise<SearchResult[]> {
    try {
      const cacheKey = getCacheKey(query, options);
      
      if (redisClient) {
        const cachedResults = await redisClient.get(cacheKey);
        if (cachedResults) {
          logger.debug(`Cache hit for: ${cacheKey}`);
          return JSON.parse(cachedResults);
        }
      }

      const normalizedQuery = query.toLowerCase();
      
      const patterns = parseSubstringPatterns(normalizedQuery);
      logger.debug(`Searching for patterns: ${patterns.join(', ')}`);

      if (options.exact || patterns.length === 1) {
        const results = await this.exactSearch(patterns[0], options, dbClient);
        
        if (redisClient) {
          await redisClient.set(
            cacheKey,
            JSON.stringify(results),
            'EX',
            config.redis.ttl
          );
        }
        
        return results;
      } 
      else {
        const results = await this.substringSearch(patterns, options, dbClient);
        
        if (redisClient) {
          await redisClient.set(
            cacheKey,
            JSON.stringify(results),
            'EX',
            config.redis.ttl
          );
        }
        
        return results;
      }
    } catch (error) {
      logger.error(`Search error: ${error}`);
      throw error;
    }
  },
  
  async exactSearch(
    query: string,
    options: SearchOptions,
    dbClient: Client
  ): Promise<SearchResult[]> {
    const limit = options.limit;
    const normalizedQuery = normalizeHex(query);
    
    const blockQuery = 'SELECT * FROM hexsearch.blocks WHERE hash = ? LIMIT ?';
    const txQuery = 'SELECT * FROM hexsearch.transactions WHERE hash = ? LIMIT ?';
    const addrQuery = 'SELECT * FROM hexsearch.addresses WHERE address = ? LIMIT ?';
    
    const blockchainFilter = options.blockchain ? 
      ' AND blockchain = ?' : '';
    
    const [blocks, transactions, addresses] = await Promise.all([
      dbClient.execute(blockQuery + blockchainFilter, 
        options.blockchain ? 
          [normalizedQuery, limit, options.blockchain] : 
          [normalizedQuery, limit], 
        { prepare: true }),
      dbClient.execute(txQuery + blockchainFilter, 
        options.blockchain ? 
          [normalizedQuery, limit, options.blockchain] : 
          [normalizedQuery, limit], 
        { prepare: true }),
      dbClient.execute(addrQuery + blockchainFilter, 
        options.blockchain ? 
          [normalizedQuery, limit, options.blockchain] : 
          [normalizedQuery, limit], 
        { prepare: true })
    ]);
    
    const results: SearchResult[] = [
      ...blocks.rows.map(block => ({
        id: `${block.blockchain}-block-${block.number}`,
        hash: block.hash,
        type: 'Block',
        blockchain: block.blockchain,
        blockNumber: block.number,
        timestamp: block.timestamp,
        parentHash: block.parent_hash
      })),
      ...transactions.rows.map(tx => ({
        id: `${tx.blockchain}-tx-${tx.hash.substring(0, 10)}`,
        hash: tx.hash,
        type: 'Transaction',
        blockchain: tx.blockchain,
        blockNumber: tx.block_number,
        timestamp: tx.timestamp,
        from: tx.from_address,
        to: tx.to_address,
        value: tx.value
      })),
      ...addresses.rows.map(addr => ({
        id: `${addr.blockchain}-addr-${addr.address.substring(0, 10)}`,
        hash: addr.address,
        type: 'Address',
        blockchain: addr.blockchain,
        timestamp: addr.updated_at || addr.created_at
      }))
    ];
    
    return results
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, options.limit);
  },
  
  async substringSearch(
    patterns: string[],
    options: SearchOptions,
    dbClient: Client
  ): Promise<SearchResult[]> {
    const limit = options.limit;
    
    const placeholders = patterns.map(() => '?').join(' AND hash LIKE ');
    const valuesWithWildcards = patterns.map(p => `%${p}%`);
    
    const blockQuery = `SELECT * FROM hexsearch.blocks WHERE hash LIKE ${placeholders}`;
    const txQuery = `SELECT * FROM hexsearch.transactions WHERE hash LIKE ${placeholders}`;
    const addrQuery = `SELECT * FROM hexsearch.addresses WHERE address LIKE ${placeholders}`;
    
    const blockchainFilter = options.blockchain ? 
      ' AND blockchain = ?' : '';
    
    const queryParams = options.blockchain ? 
      [...valuesWithWildcards, options.blockchain] : 
      valuesWithWildcards;
    
    const [blocks, transactions, addresses] = await Promise.all([
      dbClient.execute(blockQuery + blockchainFilter + ' LIMIT ? ALLOW FILTERING', 
        [...queryParams, limit], 
        { prepare: true }),
      dbClient.execute(txQuery + blockchainFilter + ' LIMIT ? ALLOW FILTERING', 
        [...queryParams, limit], 
        { prepare: true }),
      dbClient.execute(addrQuery + blockchainFilter + ' LIMIT ? ALLOW FILTERING', 
        [...queryParams, limit], 
        { prepare: true })
    ]);
    
    const results: SearchResult[] = [
      ...blocks.rows.map(block => ({
        id: `${block.blockchain}-block-${block.number}`,
        hash: block.hash,
        type: 'Block',
        blockchain: block.blockchain,
        blockNumber: block.number,
        timestamp: block.timestamp,
        parentHash: block.parent_hash
      })),
      ...transactions.rows.map(tx => ({
        id: `${tx.blockchain}-tx-${tx.hash.substring(0, 10)}`,
        hash: tx.hash,
        type: 'Transaction',
        blockchain: tx.blockchain,
        blockNumber: tx.block_number,
        timestamp: tx.timestamp,
        from: tx.from_address,
        to: tx.to_address,
        value: tx.value
      })),
      ...addresses.rows.map(addr => ({
        id: `${addr.blockchain}-addr-${addr.address.substring(0, 10)}`,
        hash: addr.address,
        type: 'Address',
        blockchain: addr.blockchain,
        timestamp: addr.updated_at || addr.created_at
      }))
    ];
    
    return results
      .sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(0, options.limit);
  },

  async getDetails(
    hash: string,
    type: string | undefined,
    dbClient: Client,
    redisClient: Redis | null
  ): Promise<any> {
    try {
      const cacheKey = `details:${hash}:${type || 'all'}`;
      
      if (redisClient) {
        const cachedResult = await redisClient.get(cacheKey);
        if (cachedResult) {
          logger.debug(`Cache hit for details: ${cacheKey}`);
          return JSON.parse(cachedResult);
        }
      }

      let result: any = null;
      const normalizedHash = normalizeHex(hash);

      if (type) {
        switch (type.toLowerCase()) {
          case 'block':
            const blockQuery = 'SELECT * FROM hexsearch.blocks WHERE hash = ? LIMIT 1';
            const blockResult = await dbClient.execute(blockQuery, [normalizedHash], { prepare: true });
            result = blockResult.rows[0] || null;
            break;
          case 'transaction':
            const txQuery = 'SELECT * FROM hexsearch.transactions WHERE hash = ? LIMIT 1';
            const txResult = await dbClient.execute(txQuery, [normalizedHash], { prepare: true });
            result = txResult.rows[0] || null;
            break;
          case 'address':
            const addrQuery = 'SELECT * FROM hexsearch.addresses WHERE address = ? LIMIT 1';
            const addrResult = await dbClient.execute(addrQuery, [normalizedHash], { prepare: true });
            result = addrResult.rows[0] || null;
            break;
        }
      } else {
        const blockQuery = 'SELECT * FROM hexsearch.blocks WHERE hash = ? LIMIT 1';
        const blockResult = await dbClient.execute(blockQuery, [normalizedHash], { prepare: true });
        
        if (blockResult.rows.length > 0) {
          result = blockResult.rows[0];
        } else {
          const txQuery = 'SELECT * FROM hexsearch.transactions WHERE hash = ? LIMIT 1';
          const txResult = await dbClient.execute(txQuery, [normalizedHash], { prepare: true });
          
          if (txResult.rows.length > 0) {
            result = txResult.rows[0];
          } else {
            const addrQuery = 'SELECT * FROM hexsearch.addresses WHERE address = ? LIMIT 1';
            const addrResult = await dbClient.execute(addrQuery, [normalizedHash], { prepare: true });
            
            if (addrResult.rows.length > 0) {
              result = addrResult.rows[0];
            }
          }
        }
      }

      if (!result) {
        return null;
      }

      const formattedResult = this.formatDetailResult(result);

      if (redisClient) {
        await redisClient.set(
          cacheKey,
          JSON.stringify(formattedResult),
          'EX',
          config.redis.ttl
        );
      }

      return formattedResult;
    } catch (error) {
      logger.error(`Get details error: ${error}`);
      throw error;
    }
  },
  
  formatDetailResult(result: any): any {
    let type = '';
    if ('number' in result) {
      type = 'Block';
    } else if ('from_address' in result) {
      type = 'Transaction';
    } else {
      type = 'Address';
    }
    
    const formatted: any = {
      type,
      blockchain: result.blockchain,
    };
    
    if (type === 'Block') {
      formatted.hash = result.hash;
      formatted.number = result.number;
      formatted.parentHash = result.parent_hash;
      formatted.timestamp = result.timestamp;
    } else if (type === 'Transaction') {
      formatted.hash = result.hash;
      formatted.blockNumber = result.block_number;
      formatted.from = result.from_address;
      formatted.to = result.to_address;
      formatted.value = result.value;
      formatted.timestamp = result.timestamp;
    } else {
      formatted.hash = result.address;
      formatted.address = result.address;
      formatted.createdAt = result.created_at;
      formatted.updatedAt = result.updated_at;
    }
    
    return formatted;
  }
}; 