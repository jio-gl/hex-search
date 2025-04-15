# HexSearch System Architecture

<img width="1255" alt="image" src="https://github.com/user-attachments/assets/3c6c22c5-8bbb-43b0-b5bc-78a4d00aa77b" />


The project consists of three main components:

1. **Frontend**: React-based UI deployed on GitHub Pages
2. **Crawler Service**: Indexes blockchain data into ScyllaDB
3. **Query Service**: Handles search requests with Redis caching

## Architecture Diagram

```mermaid
flowchart TB
    subgraph "Frontend"
        UI[React UI]
    end
    
    subgraph "API Layer"
        API[Query Service]
        Cache[(Redis Cache)]
        API <--> Cache
    end
    
    subgraph "Data Processing"
        Crawler[Crawler Service]
        Queue[(Redis Queue)]
        Crawler <--> Queue
    end
    
    subgraph "ScyllaDB Cluster"
        Node1[(ScyllaDB Node 1)]
        Node2[(ScyllaDB Node 2)]
        Node3[(ScyllaDB Node 3)]
        Node1 <--> Node2
        Node2 <--> Node3
        Node3 <--> Node1
    end
    
    subgraph "Blockchain Sources"
        ETH[Ethereum Nodes]
        BTC[Bitcoin Nodes]
        Polygon[Polygon Nodes]
        Other[Other Blockchains]
    end
    
    UI <--> API
    API <--> Node1
    API <--> Node2
    API <--> Node3
    
    Crawler <--> Node1
    Crawler <--> Node2
    Crawler <--> Node3
    
    Crawler <--> ETH
    Crawler <--> BTC
    Crawler <--> Polygon
    Crawler <--> Other
    
    classDef frontend fill:#f9f,stroke:#333,stroke-width:2px
    classDef api fill:#bbf,stroke:#333,stroke-width:2px
    classDef processing fill:#bfb,stroke:#333,stroke-width:2px
    classDef database fill:#ff9,stroke:#333,stroke-width:2px
    classDef sources fill:#fbb,stroke:#333,stroke-width:2px
    
    class UI frontend
    class API,Cache api
    class Crawler,Queue processing
    class Node1,Node2,Node3 database
    class ETH,BTC,Polygon,Other sources
```

## Component Details

### Frontend
- React-based single-page application
- Responsive design for mobile and desktop
- Real-time search with debouncing
- Result caching for improved performance

### Query Service
- Express.js REST API
- Redis caching layer for frequent queries
- Load balancing ready
- Rate limiting and request validation

### Crawler Service
- Blockchain data indexing
- Multiple blockchain support
- Configurable crawling strategies
- Queue-based processing

### Database Layer
- ScyllaDB for high-performance storage
- Optimized schema for hex searches
- Multi-node clustering support
- Automatic data partitioning

## Data Flow

1. User enters search query in UI
2. Query service checks Redis cache
3. If not cached, query service searches ScyllaDB
4. Results are cached and returned to UI
5. Crawler continuously indexes new blockchain data
6. New data is stored in ScyllaDB for future queries 
