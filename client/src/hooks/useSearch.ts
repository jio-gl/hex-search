import React, { createContext, useContext, useState } from 'react';

interface SearchResult {
  id: string;
  blockchain: string;
  blockNumber: number;
  blockHash: string;
  transactionHash: string;
  hexData: string;
  timestamp: string;
}

interface SearchState {
  results: SearchResult[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  selectedChain: string;
}

interface SearchContextType extends SearchState {
  search: (query: string, blockchain: string) => Promise<void>;
}

const SearchContext = createContext<SearchContextType | undefined>(undefined);

const API_BASE_URL = 'http://localhost:3001'; // Query service runs on port 3001

export const SearchProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SearchState>({
    results: [],
    loading: false,
    error: null,
    searchTerm: '',
    selectedChain: 'ethereum'
  });

  const search = async (query: string, blockchain: string) => {
    setState(prev => ({ ...prev, loading: true, error: null }));
    try {
      const response = await fetch(`${API_BASE_URL}/api/search?q=${encodeURIComponent(query)}&blockchain=${blockchain}`, {
        headers: {
          'Accept': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Search request failed: ${errorText}`);
      }
      
      const data = await response.json();
      setState(prev => ({
        ...prev,
        results: data,
        loading: false,
        searchTerm: query,
        selectedChain: blockchain
      }));
    } catch (error) {
      setState(prev => ({
        ...prev,
        error: error instanceof Error ? error.message : 'An error occurred',
        loading: false
      }));
    }
  };

  const value = { ...state, search };

  return React.createElement(SearchContext.Provider, { value }, children);
};

export const useSearch = () => {
  const context = useContext(SearchContext);
  if (context === undefined) {
    throw new Error('useSearch must be used within a SearchProvider');
  }
  return context;
};
