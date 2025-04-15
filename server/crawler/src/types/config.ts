export interface CrawlerConfig {
  infuraApiKey: string;
  dbConfig: {
    host: string;
    port: number;
    keyspace: string;
    username?: string;
    password?: string;
  };
  crawlerConfig: {
    maxBlocksPerBatch: number;
    batchIntervalMs: number;
  };
} 