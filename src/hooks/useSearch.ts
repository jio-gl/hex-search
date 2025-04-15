import { useState } from 'react';
import axios from 'axios';

interface SearchResult {
  type: 'address' | 'transaction' | 'block';
  value: string;
  chain: 'ethereum' | 'bitcoin';
  timestamp: number;
  details: Record<string, any>;
}

export const useSearch = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<SearchResult[]>([]);

  const search = async (query: string, isExact: boolean = false) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await axios.get(`${process.env.REACT_APP_API_URL}/search`, {
        params: {
          q: query,
          exact: isExact
        }
      });
      
      setResults(response.data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred while searching');
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return {
    search,
    loading,
    error,
    results
  };
}; 