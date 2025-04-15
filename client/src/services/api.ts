import axios from 'axios';
import { SearchResult } from '../types';

// In production, this would be an environment variable
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://api.hexsearch.example';

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const searchHexData = async (query: string): Promise<SearchResult[]> => {
  try {
    const response = await apiClient.get<{ results: SearchResult[] }>(`/search?q=${encodeURIComponent(query)}`);
    return response.data.results;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      throw new Error(error.response?.data?.message || 'Failed to search. Please try again.');
    }
    throw new Error('An unexpected error occurred');
  }
};

// For development/testing without backend
export const mockSearchHexData = async (query: string): Promise<SearchResult[]> => {
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // Sample mock data
  const mockResults: SearchResult[] = [
    {
      id: '1',
      hash: query.startsWith('0x') ? query : `0x${query}`,
      type: 'Transaction',
      blockchain: 'Ethereum',
      blockNumber: 15432156,
      timestamp: new Date().getTime() - 3600000, // 1 hour ago
    },
    {
      id: '2',
      hash: '0x' + Math.random().toString(16).slice(2, 42),
      type: 'Address',
      blockchain: 'Ethereum',
      blockNumber: 15432100,
      timestamp: new Date().getTime() - 7200000, // 2 hours ago
    },
    {
      id: '3',
      hash: '0x' + Math.random().toString(16).slice(2, 42),
      type: 'Contract',
      blockchain: 'Polygon',
      blockNumber: 34567890,
      timestamp: new Date().getTime() - 10800000, // 3 hours ago
    }
  ];
  
  return mockResults;
};

// Replace the real implementation with mock for development
// In a real app, you'd switch based on environment
// export const searchHexData = mockSearchHexData;
