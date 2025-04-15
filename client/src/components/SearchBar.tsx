import React, { useState } from 'react';
import toast from 'react-hot-toast';

interface SearchBarProps {
  onSearch: (params: { query: string; blockchain: string }) => void;
}

const SearchBar: React.FC<SearchBarProps> = ({ onSearch }) => {
  const [query, setQuery] = useState('');
  const [blockchain, setBlockchain] = useState('ethereum');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!query.trim()) {
      setError('Please enter a search query');
      toast.error('Please enter a search query');
      return;
    }

    // Validate hex format (allowing wildcards)
    const hexPattern = /^(0x)?[0-9a-fA-F*]+$/;
    if (!hexPattern.test(query)) {
      setError('Invalid hex value format');
      toast.error('Invalid hex value format');
      return;
    }

    onSearch({ query, blockchain });
  };

  return (
    <form onSubmit={handleSubmit} className="w-full max-w-2xl mx-auto">
      <div className="flex flex-col space-y-4">
        <div className="flex items-center space-x-4">
          <select
            value={blockchain}
            onChange={(e) => setBlockchain(e.target.value)}
            className="block w-40 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            data-testid="blockchain-select"
          >
            <option value="ethereum">Ethereum</option>
            <option value="bitcoin">Bitcoin</option>
            <option value="polygon">Polygon</option>
          </select>
          <div className="flex-1">
            <div className="flex items-center border-2 border-gray-300 rounded-lg overflow-hidden">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Enter hex value (e.g., 0x1a2b or *2b or 1a*)"
                className="flex-1 px-4 py-2 focus:outline-none"
                data-testid="search-input"
              />
              <button
                type="submit"
                className="px-6 py-2 bg-blue-500 text-white hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed"
                data-testid="search-button"
              >
                Search
              </button>
            </div>
            {error && (
              <p className="mt-2 text-sm text-red-500" data-testid="error-message">
                {error}
              </p>
            )}
            <p className="mt-2 text-sm text-gray-500">
              You can search for full hex values (0x1234), partial matches (0x12*), or patterns (*34*). Wildcards (*) are supported.
            </p>
          </div>
        </div>
      </div>
    </form>
  );
};

export default SearchBar;
