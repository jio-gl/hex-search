import React, { useState } from 'react';
import { toast } from 'react-hot-toast';
import { useSearch } from '../hooks/useSearch';

const SearchBar: React.FC = () => {
  const [query, setQuery] = useState('');
  const [isExactSearch, setIsExactSearch] = useState(false);
  const { search, loading } = useSearch();

  const isValidHex = (value: string): boolean => {
    return /^(0x)?[0-9a-fA-F]+$/.test(value);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!query.trim()) {
      toast.error('Please enter a search query');
      return;
    }

    // Only validate hex format for exact searches
    if (isExactSearch && !isValidHex(query)) {
      toast.error('Please enter a valid hexadecimal value for exact search');
      return;
    }

    // For substring search, just convert to lowercase
    const normalizedQuery = query.toLowerCase();
    search(normalizedQuery, isExactSearch);
  };

  return (
    <div className="mb-8">
      <form onSubmit={handleSearch} className="mt-2">
        <div className="rounded-md shadow-sm -space-y-px">
          <div className="relative">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
              placeholder="Search for hash, address, transaction, or substring patterns..."
              spellCheck={false}
              autoComplete="off"
            />
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
        
        <div className="mt-4 flex items-center justify-between">
          <div>
            <label className="inline-flex items-center">
              <input
                type="checkbox"
                className="form-checkbox h-4 w-4 text-primary-600 transition duration-150 ease-in-out"
                checked={isExactSearch}
                onChange={(e) => setIsExactSearch(e.target.checked)}
              />
              <span className="ml-2 text-sm text-gray-700">Exact match (hex only)</span>
            </label>
          </div>
          
          <button
            type="submit"
            disabled={loading}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              loading ? 'opacity-75 cursor-not-allowed' : ''
            }`}
          >
            {loading ? 'Searching...' : 'Search'}
          </button>
        </div>
      </form>
      
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div>
          <span className="font-medium">Examples:</span>
        </div>
        <div>
          <span className="font-mono">• Exact address: 0x742d35Cc6634C0532925a3b844Bc454e4438f44e</span>
        </div>
        <div>
          <span className="font-mono">• Substring: d389Cc1E1d165CC4BAfe5</span>
        </div>
        <div>
          <span className="font-mono">• Multiple patterns: 06E3 13D0</span> <span className="text-gray-500">(space-separated)</span>
        </div>
        <div>
          <span className="text-gray-500">All searches are converted to lowercase for consistency</span>
        </div>
      </div>
    </div>
  );
};

export default SearchBar; 