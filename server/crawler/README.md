# HexSearch Crawler

A blockchain crawler service for HexSearch that indexes transactions and addresses from multiple blockchains.

## Prerequisites

- Node.js v18 or later
- Docker and Docker Compose
- An Infura API key (for Ethereum) or alternative RPC provider
- A GetBlock API key (for Bitcoin) or alternative RPC provider

## Local Development Setup

1. Clone the repository and navigate to the crawler directory:
   ```bash
   cd server/crawler
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```

4. Update the `.env` file with your configuration:
   - Add your Infura API key to `ETH_RPC_URL`
   - Add your GetBlock credentials to `BTC_RPC_URL`, `BTC_RPC_USER`, and `BTC_RPC_PASSWORD`
   - Adjust other settings as needed

5. Start the required services (ScyllaDB and Redis):
   ```bash
   docker-compose -f docker-compose.dev.yml up -d
   ```

6. Run the development server:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev` - Start the development server with hot-reload
- `npm run build` - Build the TypeScript code
- `npm start` - Run the built code in production
- `npm test` - Run tests
- `npm run lint` - Check for linting issues
- `npm run lint:fix` - Fix linting issues automatically
- `npm run format` - Format code using Prettier
- `npm run check-types` - Check TypeScript types
- `npm run validate` - Run all checks (types, lint, test)

## Project Structure

```
src/
├── blockchain/       # Blockchain-specific crawlers
├── queue/           # Job queue setup and processors
├── utils/           # Utility functions
├── config.ts        # Configuration management
└── index.ts         # Application entry point
```

## Configuration

The crawler can be configured using environment variables:

### Database
- `SCYLLA_CONTACT_POINTS` - ScyllaDB contact points (default: localhost:9042)
- `SCYLLA_DATACENTER` - ScyllaDB datacenter name
- `SCYLLA_KEYSPACE` - ScyllaDB keyspace name

### Redis
- `REDIS_HOST` - Redis host (default: localhost)
- `REDIS_PORT` - Redis port (default: 6379)

### Ethereum
- `ETH_RPC_URL` - Ethereum RPC URL (e.g., Infura)
- `ETH_START_BLOCK` - Starting block number
- `ETH_BATCH_SIZE` - Number of blocks to process in parallel

### Bitcoin
- `BTC_RPC_URL` - Bitcoin RPC URL
- `BTC_RPC_USER` - Bitcoin RPC username
- `BTC_RPC_PASSWORD` - Bitcoin RPC password
- `BTC_START_BLOCK` - Starting block number
- `BTC_BATCH_SIZE` - Number of blocks to process in parallel

### Crawler
- `CRAWLER_CONCURRENCY` - Number of concurrent crawlers
- `CRAWLER_INTERVAL` - Interval between block processing (ms)

### Logging
- `LOG_LEVEL` - Logging level (debug, info, warn, error)

## Contributing

1. Create a feature branch
2. Make your changes
3. Run `npm run validate` to ensure all checks pass
4. Submit a pull request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details. 