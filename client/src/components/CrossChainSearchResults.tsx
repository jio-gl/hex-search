import React from 'react';
import { useCrossChainSearch } from '../hooks/useCrossChainSearch';

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

const formatTimestamp = (timestamp: string): string => {
  try {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
    if (diffInSeconds < 2592000) return `${Math.floor(diffInSeconds / 86400)}d ago`;
    
    return date.toLocaleDateString();
  } catch (e) {
    return timestamp;
  }
};

const getInteractionLabel = (type?: string): { text: string; color: string } => {
  switch (type) {
    case 'fee_recipient':
      return { text: 'Fee Recipient', color: 'bg-green-100 text-green-800' };
    case 'transaction_from':
      return { text: 'Sender', color: 'bg-red-100 text-red-800' };
    case 'transaction_to':
      return { text: 'Receiver', color: 'bg-blue-100 text-blue-800' };
    case 'contract_creation':
      return { text: 'Contract Creation', color: 'bg-purple-100 text-purple-800' };
    default:
      return { text: 'Unknown', color: 'bg-gray-100 text-gray-800' };
  }
};

const CrossChainSearchResults: React.FC = () => {
  const { results, loading, error } = useCrossChainSearch();

  if (loading) {
    return (
      <div className="flex justify-center items-center py-8">
        <div 
          className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"
          role="status"
          aria-label="Loading results"
        >
          <span className="sr-only">Loading...</span>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-red-500 text-center py-4">
        Error: {error}
      </div>
    );
  }

  if (!results || results.length === 0) {
    return (
      <div className="text-gray-500 text-center py-4">
        No results found
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {results.map((result: SearchResult) => (
        <div key={result.id} className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center space-x-2">
              <span className="text-sm font-medium text-blue-600 capitalize">
                {result.blockchain}
              </span>
              {result.type && (
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${getInteractionLabel(result.type).color}`}>
                  {getInteractionLabel(result.type).text}
                </span>
              )}
            </div>
            <span className="text-xs text-gray-500">
              {formatTimestamp(result.timestamp)}
            </span>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-start">
              <span className="text-sm font-medium text-gray-500 min-w-24">Block:</span>
              <a 
                href={`https://${result.blockchain === 'ethereum' ? '' : result.blockchain + '.'}etherscan.io/block/${result.blockNumber}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-800"
              >
                #{result.blockNumber.toLocaleString()}
              </a>
            </div>
            
            {result.blockHash && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 min-w-24">Block Hash:</span>
                <span className="text-sm text-gray-900 break-all font-mono">
                  {result.blockHash}
                </span>
              </div>
            )}
            
            {result.transactionHash && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 min-w-24">Tx Hash:</span>
                <a 
                  href={`https://${result.blockchain === 'ethereum' ? '' : result.blockchain + '.'}etherscan.io/tx/${result.transactionHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 break-all font-mono"
                >
                  {result.transactionHash}
                </a>
              </div>
            )}

            {result.address && (
              <div className="flex items-start">
                <span className="text-sm font-medium text-gray-500 min-w-24">Address:</span>
                <a 
                  href={`https://${result.blockchain === 'ethereum' ? '' : result.blockchain + '.'}etherscan.io/address/${result.address}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 break-all font-mono"
                >
                  {result.address}
                </a>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default CrossChainSearchResults;
