import { Request, Response } from 'express';
import { cassandraClient, redisClient } from '../database';
import { logger } from '../utils/logger';

export const searchController = {
  async search(req: Request, res: Response) {
    try {
      const { query, blockchain } = req.query;
      
      if (!query) {
        return res.status(400).json({ error: 'Query parameter is required' });
      }

      // Try to get from cache first
      const cacheKey = `search:${blockchain}:${query}`;
      const cachedResult = await redisClient.get(cacheKey);
      
      if (cachedResult) {
        return res.json(JSON.parse(cachedResult));
      }

      // If not in cache, query Cassandra
      const result = await cassandraClient.execute(
        'SELECT * FROM transactions WHERE blockchain = ? AND hex_data LIKE ?',
        [blockchain, `%${query}%`],
        { prepare: true }
      );

      const searchResult = {
        query,
        blockchain,
        results: result.rows,
        timestamp: new Date().toISOString()
      };

      // Cache the result
      await redisClient.set(cacheKey, JSON.stringify(searchResult), {
        EX: 3600 // Cache for 1 hour
      });

      res.json(searchResult);
    } catch (error) {
      logger.error('Search error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
}; 