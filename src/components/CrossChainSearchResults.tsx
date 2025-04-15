import React from 'react';
import { useCrossChainSearch } from '../hooks/useCrossChainSearch';

const CrossChainSearchResults: React.FC = () => {
  const { results, loading, error } = useCrossChainSearch();

  // Format timestamp
  const formatDate = (date: Date): string => {
    return date.toLocaleString();
  };

  // Shorten address for display
  const shortenAddress = (address: string, chars = 6): string => {
    return `${address.substring(0, chars + 2)}...${address.substring(address.length - chars)}`;
  };

  if (loading) {
    return (
      <div className="text-center py-10">
        <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-500"></div>
        <p className="mt-2 text-gray-600">Searching across blockchains...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 my-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!results) {
    return null;
  }

  if (results.addressCount === 0) {
    return (
      <div className="bg-white shadow overflow-hidden sm:rounded-lg p-6">
        <div className="text-center">
          <p className="text-gray-500 mb-2">No addresses found matching fragments:</p>
          <div className="flex flex-wrap justify-center gap-2 mb-4">
            {results.fragments.map((fragment, idx) => (
              <span key={idx} className="px-2 py-1 bg-gray-100 rounded-md font-mono text-xs">
                {fragment}
              </span>
            ))}
          </div>
          <p className="text-sm text-gray-500">Try different fragments or select more blockchains</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Addresses Section */}
      <div className="bg-white shadow overflow-hidden sm:rounded-lg">
        <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
          <h3 className="text-lg leading-6 font-medium text-gray-900">Matching Addresses</h3>
          <p className="mt-1 max-w-2xl text-sm text-gray-500">
            Found {results.addressCount} address{results.addressCount !== 1 ? 'es' : ''} matching:
            {results.fragments.map((fragment, idx) => (
              <span key={idx} className="ml-2 px-2 py-0.5 bg-gray-100 rounded font-mono text-xs">
                {fragment}
              </span>
            ))}
          </p>
        </div>
        
        <ul className="divide-y divide-gray-200">
          {results.results.addresses.map((address) => (
            <li key={address.address} className="px-4 py-4 sm:px-6 hover:bg-gray-50">
              <div className="flex flex-col sm:flex-row sm:justify-between">
                <div className="mb-2 sm:mb-0">
                  <span className="font-mono text-sm text-gray-900 break-all">
                    {address.address}
                  </span>
                  <div className="mt-1 flex flex-wrap gap-1">
                    {address.blockchains.map((chain) => (
                      <span key={chain} className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        {chain}
                      </span>
                    ))}
                  </div>
                </div>
                <div className="flex flex-col items-start sm:items-end text-sm text-gray-500">
                  <div>First seen: {formatDate(address.firstSeen)}</div>
                  <div>Last seen: {formatDate(address.lastSeen)}</div>
                  <div>{address.txCount} transaction{address.txCount !== 1 ? 's' : ''}</div>
                </div>
              </div>
            </li>
          ))}
        </ul>
      </div>
      
      {/* Transactions Section */}
      {results.results.transactions.length > 0 && (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
          <div className="px-4 py-5 sm:px-6 border-b border-gray-200">
            <h3 className="text-lg leading-6 font-medium text-gray-900">Related Transactions</h3>
            <p className="mt-1 max-w-2xl text-sm text-gray-500">
              Found {results.transactionCount} transaction{results.transactionCount !== 1 ? 's' : ''} involving these addresses
            </p>
          </div>
          
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Transaction Hash
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Blockchain
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    From
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    To
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Block
                  </th>
                  <th scope="col" className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Time
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {results.results.transactions.map((tx) => (
                  <tr key={`${tx.blockchain}-${tx.txHash}`} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-900">
                      {shortenAddress(tx.txHash, 8)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {tx.blockchain}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500">
                      {tx.fromAddress ? shortenAddress(tx.fromAddress) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap font-mono text-xs text-gray-500">
                      {tx.toAddress ? shortenAddress(tx.toAddress) : '-'}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {tx.blockNumber}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-xs text-gray-500">
                      {formatDate(tx.timestamp)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default CrossChainSearchResults; 