import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || '3001'),
  
  // ScyllaDB configuration
  scylla: {
    hosts: process.env.SCYLLA_HOSTS ? process.env.SCYLLA_HOSTS.split(',') : ['127.0.0.1'],
    datacenter: process.env.SCYLLA_DATACENTER || 'datacenter1',
    keyspace: process.env.SCYLLA_KEYSPACE || 'hexsearch',
    username: process.env.SCYLLA_USERNAME,
    password: process.env.SCYLLA_PASSWORD,
  },
  
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    ttl: parseInt(process.env.REDIS_CACHE_TTL || '3600') // 1 hour default
  },
  
  rateLimit: {
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || '60000'), // 1 minute
    max: parseInt(process.env.RATE_LIMIT_MAX || '100') // limit each IP to 100 requests per windowMs
  },
  
  cors: {
    origin: process.env.CORS_ORIGIN || '*',
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    preflightContinue: false,
    optionsSuccessStatus: 204
  },
  
  log: {
    level: process.env.LOG_LEVEL || 'info',
  }
}; 