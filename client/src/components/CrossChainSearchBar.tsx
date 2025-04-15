import React, { useState } from 'react';
import { useCrossChainSearch } from '../hooks/useCrossChainSearch';

const SUPPORTED_BLOCKCHAINS = [
  { id: 'all', name: 'All Chains' },
  { id: 'ethereum', name: 'Ethereum' },
  { id: 'bitcoin', name: 'Bitcoin' },
  { id: 'polygon', name: 'Polygon' },
  { id: 'bsc', name: 'BNB Chain' },
];

const CrossChainSearchBar: React.FC = () => {
  const [inputValue, setInputValue] = useState('');
  const [selectedChain, setSelectedChain] = useState(SUPPORTED_BLOCKCHAINS[0].id);
  const { search, loading } = useCrossChainSearch();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      search(inputValue.trim(), selectedChain === 'all' ? undefined : selectedChain);
    }
  };

  return (
    <div className="w-full">
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="flex flex-col space-y-4">
          <div className="flex items-center space-x-4">
            <select
              value={selectedChain}
              onChange={(e) => setSelectedChain(e.target.value)}
              className="px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 bg-white"
              disabled={loading}
            >
              {SUPPORTED_BLOCKCHAINS.map((chain) => (
                <option key={chain.id} value={chain.id}>
                  {chain.name}
                </option>
              ))}
            </select>
            <div className="relative flex-1">
              <input
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Enter hex value (e.g., 0x1234, *34*, 0x12*)"
                className="w-full px-4 py-3 text-lg border-2 border-gray-300 rounded-lg focus:outline-none focus:border-blue-500 pr-32"
                disabled={loading}
              />
              <button
                type="submit"
                className="absolute right-2 top-1/2 transform -translate-y-1/2 px-6 py-2 bg-blue-500 text-white rounded-md hover:bg-blue-600 focus:outline-none disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                disabled={loading}
              >
                {loading ? 'Searching...' : 'Search'}
              </button>
            </div>
          </div>
        </div>
        <div className="text-sm text-gray-500 space-y-2">
          <p>
            <span className="font-medium">Search Tips:</span>
          </p>
          <ul className="list-disc pl-5 space-y-1">
            <li>Full hex values: <code className="bg-gray-100 px-1 rounded">0x1234abcd</code></li>
            <li>Partial matches: <code className="bg-gray-100 px-1 rounded">0x12*</code> or <code className="bg-gray-100 px-1 rounded">*abcd</code></li>
            <li>Pattern search: <code className="bg-gray-100 px-1 rounded">*34*</code> finds any hex containing "34"</li>
            <li>Case insensitive: "0xAbCd" matches "0xabcd"</li>
          </ul>
        </div>
      </form>
    </div>
  );
};

export default CrossChainSearchBar;
