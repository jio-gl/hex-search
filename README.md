# HexSearch

Blockchain hash search engine - instantly search through Ethereum, Bitcoin, and more.

## Features

- **Unified Blockchain Search**: Search across Ethereum, Bitcoin, and other blockchains
- **Flexible Search Options**: Exact match, substring search, and multi-pattern search
- **Real-time Indexing**: Continuous indexing of blockchain data
- **High Performance**: Optimized for 10+ queries per second
- **Scalable Architecture**: Microservices architecture with ScyllaDB and Redis

For detailed architecture information, see [ARCHITECTURE.md](ARCHITECTURE.md).

## Development

### Prerequisites

- Docker and Docker Compose
- Git
- Node.js 18+ (only for non-Docker development)

### Local Development (Recommended)

This approach uses Docker Compose for a consistent development environment:

1. Clone the repository:
```bash
git clone https://github.com/yourusername/hex-search.git
cd hex-search
```

2. Set up environment files:
```bash
# Copy environment files
cp client/.env.example client/.env
cp server/crawler/.env.example server/crawler/.env
cp server/query/.env.example server/query/.env
```

3. Start the development environment:
```bash
docker-compose -f docker-compose.dev.yml up -d
```

All services will be available with hot-reloading:
- Frontend: http://localhost:3000
- Query API: http://localhost:3001
- Crawler Service: http://localhost:3002
- ScyllaDB: localhost:9042
- Redis: localhost:6379

View logs:
```bash
# All services
docker-compose -f docker-compose.dev.yml logs -f

# Specific service
docker-compose -f docker-compose.dev.yml logs -f query-service
```

### Alternative: Development Without Docker

If you prefer direct control over services or are working on a specific component:

1. Install dependencies:
- ScyllaDB 5.2+
- Redis 7+
- Node.js 18+

Or use Docker just for databases:
```bash
docker-compose -f docker-compose.dev.yml up -d scylla redis
```

2. Set up frontend:
```bash
cd client
cp .env.example .env
npm install
npm start
```

3. Set up crawler service:
```bash
cd server/crawler
cp .env.example .env
npm install
npm run dev
```

4. Set up query service:
```bash
cd server/query
cp .env.example .env
npm install
npm run dev
```

Environment configurations:

Frontend (.env):
```
REACT_APP_API_URL=http://localhost:3001
REACT_APP_SUPPORTED_CHAINS=ethereum,bitcoin
```

Query Service (.env):
```
PORT=3001
SCYLLA_HOSTS=localhost
REDIS_HOST=localhost
API_RATE_LIMIT=100
```

Crawler Service (.env):
```
ETH_RPC_URL=your-ethereum-node
BTC_RPC_URL=your-bitcoin-node
SCYLLA_HOSTS=localhost
CRAWLER_INTERVAL=60000
```

## Production Deployment

Production deployment uses Docker Compose for reliability and scalability.

1. Configure production environment:
```bash
cp .env.example .env

# Required environment variables:
SCYLLA_HOSTS=scylla-node1,scylla-node2,scylla-node3
REDIS_HOST=redis
ETH_RPC_URL=your-production-eth-node
BTC_RPC_URL=your-production-btc-node
API_RATE_LIMIT=100
SCYLLA_MEMORY=8G
REDIS_MAXMEMORY=4gb
```

2. Deploy core services:
```bash
docker-compose up -d
```

3. Deploy monitoring stack (recommended):
```bash
docker-compose -f docker-compose.monitoring.yml up -d
```

The deployment includes:
- Frontend (Nginx)
- Query service cluster
- Crawler service with failover
- ScyllaDB cluster (3 nodes)
- Redis with persistence
- Prometheus + Grafana monitoring

4. Security checklist:
- [ ] Configure SSL/TLS
- [ ] Set up firewall rules
- [ ] Enable authentication
- [ ] Configure rate limiting
- [ ] Set up backup system
- [ ] Configure log rotation

5. Monitoring:
```bash
# Service status
docker-compose ps

# View logs
docker-compose logs -f

# Resource usage
docker stats
```

Access monitoring:
- Grafana: http://your-server:3010
- Prometheus: http://your-server:9090

## Contributing

1. Fork the repository
2. Create your feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a Pull Request

## License

This project is licensed under the Apache 2.0 License - see the LICENSE file for details.