import React from 'react';
import { useSearch } from '../hooks/useSearch';

const SearchResults: React.FC = () => {
  const { results, loading, error, selectedChain } = useSearch();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        {error}
      </div>
    );
  }

  if (results.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No results found in {selectedChain}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="text-sm text-gray-500">
        Showing results from {selectedChain}
      </div>
      {results.map((result) => (
        <div
          key={result.id}
          className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow"
        >
          <div className="flex justify-between items-start">
            <div>
              <h3 className="font-medium text-gray-900">
                Block #{result.blockNumber}
              </h3>
              <p className="text-sm text-gray-500">
                {new Date(result.timestamp).toLocaleString()}
              </p>
            </div>
          </div>
          <div className="mt-2">
            <p className="text-sm font-mono break-all">
              {result.hexData}
            </p>
          </div>
          <div className="mt-2 text-xs text-gray-500">
            <p>Block Hash: {result.blockHash}</p>
            <p>Transaction Hash: {result.transactionHash}</p>
          </div>
        </div>
      ))}
    </div>
  );
};

export default SearchResults;
