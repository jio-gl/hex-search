import React, { createContext, useContext, useState, ReactNode } from 'react';
import axios from 'axios';
import { toast } from 'react-hot-toast';

// Types for cross-chain search
interface AddressResult {
  address: string;
  blockchains: string[];
  firstSeen: Date;
  lastSeen: Date;
  txCount: number;
}

interface TransactionResult {
  txHash: string;
  blockchain: string;
  blockNumber: number;
  fromAddress: string | null;
  toAddress: string | null;
  timestamp: Date;
}

interface CrossChainSearchResult {
  fragments: string[];
  addressCount: number;
  transactionCount: number;
  results: {
    addresses: AddressResult[];
    transactions: TransactionResult[];
  };
}

interface CrossChainSearchContextType {
  fragments: string;
  setFragments: (fragments: string) => void;
  results: CrossChainSearchResult | null;
  loading: boolean;
  error: string | null;
  supportedChains: string[];
  loadingChains: boolean;
  selectedChains: string[];
  setSelectedChains: (chains: string[]) => void;
  search: () => Promise<void>;
  fetchSupportedChains: () => Promise<void>;
}

const CrossChainSearchContext = createContext<CrossChainSearchContextType | undefined>(undefined);

export const CrossChainSearchProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [fragments, setFragments] = useState<string>('');
  const [results, setResults] = useState<CrossChainSearchResult | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [supportedChains, setSupportedChains] = useState<string[]>([]);
  const [loadingChains, setLoadingChains] = useState<boolean>(false);
  const [selectedChains, setSelectedChains] = useState<string[]>([]);

  // API base URL from environment
  const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:3001/api';

  // Fetch list of supported blockchains
  const fetchSupportedChains = async (): Promise<void> => {
    try {
      setLoadingChains(true);
      const response = await axios.get(`${apiBaseUrl}/cross-chain/chains`);
      setSupportedChains(response.data.chains || []);
      
      // If no chains are selected, select all by default
      if (selectedChains.length === 0 && response.data.chains?.length > 0) {
        setSelectedChains(response.data.chains);
      }
    } catch (err) {
      console.error('Failed to fetch supported chains:', err);
      toast.error('Failed to load supported blockchains');
    } finally {
      setLoadingChains(false);
    }
  };

  // Perform cross-chain search
  const search = async (): Promise<void> => {
    if (!fragments.trim()) {
      toast.error('Please enter at least one address fragment');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const chainsParam = selectedChains.length > 0 ? 
        `&chains=${selectedChains.join(',')}` : '';
        
      const response = await axios.get(
        `${apiBaseUrl}/cross-chain/search?fragments=${encodeURIComponent(fragments)}${chainsParam}`
      );
      
      // Format dates in the response
      const formattedResults = {
        ...response.data,
        results: {
          addresses: response.data.results.addresses.map((addr: any) => ({
            ...addr,
            firstSeen: new Date(addr.firstSeen),
            lastSeen: new Date(addr.lastSeen)
          })),
          transactions: response.data.results.transactions.map((tx: any) => ({
            ...tx,
            timestamp: new Date(tx.timestamp)
          }))
        }
      };
      
      setResults(formattedResults);
      
      if (formattedResults.addressCount === 0) {
        toast.info('No addresses found with these fragments');
      }
    } catch (err) {
      console.error('Cross-chain search error:', err);
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast.error('Failed to perform cross-chain search');
    } finally {
      setLoading(false);
    }
  };

  return (
    <CrossChainSearchContext.Provider
      value={{
        fragments,
        setFragments,
        results,
        loading,
        error,
        supportedChains,
        loadingChains,
        selectedChains,
        setSelectedChains,
        search,
        fetchSupportedChains
      }}
    >
      {children}
    </CrossChainSearchContext.Provider>
  );
};

export const useCrossChainSearch = (): CrossChainSearchContextType => {
  const context = useContext(CrossChainSearchContext);
  if (context === undefined) {
    throw new Error('useCrossChainSearch must be used within a CrossChainSearchProvider');
  }
  return context;
}; 