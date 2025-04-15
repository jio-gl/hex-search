import React, { createContext, useContext, useState } from 'react';

interface SearchResult {
  id: string;
  blockchain: string;
  blockNumber: number;
  timestamp: string;
  blockHash?: string;
  transactionHash?: string;
  address?: string;
  type?: 'fee_recipient' | 'transaction_from' | 'transaction_to' | 'contract_creation';
}

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
}

interface SearchContextValue extends SearchState {
  search: (query: string, blockchain?: string) => Promise<void>;
}

const SearchContext = createContext<SearchContextValue | undefined>(undefined);

export function useCrossChainSearch() {
  const context = useContext(SearchContext);
  if (!context) {
    throw new Error('useCrossChainSearch must be used within a CrossChainSearchProvider');
  }
  return context;
}

export const CrossChainSearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null
  });

  const search = async (query: string, blockchain: string = 'all') => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    
    try {
      const response = await fetch(`/api/search?q=${encodeURIComponent(query)}&blockchain=${blockchain}`);
      
      if (!response.ok) {
        throw new Error('Search request failed');
      }

      const data = await response.json();
      setState({
        results: data.results.map((result: any) => ({
          id: result.id || Math.random().toString(),
          blockchain: result.blockchain,
          blockNumber: result.blockNumber,
          timestamp: result.timestamp,
          blockHash: result.blockHash,
          transactionHash: result.transactionHash,
          address: result.address,
          type: result.type
        })),
        loading: false,
        error: null
      });
    } catch (error) {
      // For development/testing, return mock data
      if (process.env.NODE_ENV === 'development') {
        // Generate timestamps for the last few blocks
        const now = Date.now();
        const blockTimeMs = 12000; // 12 seconds per block

        setState({
          results: [
            {
              id: '1',
              blockchain: 'ethereum',
              blockNumber: 22271649,
              timestamp: new Date(now).toISOString(),
              blockHash: '0x8f6d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e2',
              address: query,
              type: 'fee_recipient'
            },
            {
              id: '2',
              blockchain: 'ethereum',
              blockNumber: 22271648,
              timestamp: new Date(now - blockTimeMs).toISOString(),
              blockHash: '0x7a1d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e1',
              transactionHash: '0x3a1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
              address: query,
              type: 'transaction_from'
            },
            {
              id: '3',
              blockchain: 'ethereum',
              blockNumber: 22271645,
              timestamp: new Date(now - blockTimeMs * 4).toISOString(),
              blockHash: '0x6b2d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5e0',
              transactionHash: '0x4b1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
              address: query,
              type: 'transaction_to'
            },
            {
              id: '4',
              blockchain: 'ethereum',
              blockNumber: 22271640,
              timestamp: new Date(now - blockTimeMs * 9).toISOString(),
              blockHash: '0x5c3d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5df',
              transactionHash: '0x5c1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
              address: query,
              type: 'fee_recipient'
            },
            {
              id: '5',
              blockchain: 'ethereum',
              blockNumber: 22271635,
              timestamp: new Date(now - blockTimeMs * 14).toISOString(),
              blockHash: '0x4d4d6d6a93f8234c82c9317d9463961899e27f0c7ef1acb6ced1b1c675c9f5de',
              transactionHash: '0x6d1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcd',
              address: query,
              type: 'transaction_to'
            }
          ],
          loading: false,
          error: null
        });
        return;
      }

      setState({
        results: [],
        loading: false,
        error: error instanceof Error ? error.message : 'An error occurred'
      });
    }
  };

  return (
    <SearchContext.Provider value={{ ...state, search }}>
      {children}
    </SearchContext.Provider>
  );
};
