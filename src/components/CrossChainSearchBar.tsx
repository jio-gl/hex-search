import React, { useEffect } from 'react';
import { useCrossChainSearch } from '../hooks/useCrossChainSearch';

const CrossChainSearchBar: React.FC = () => {
  const {
    fragments,
    setFragments,
    loading,
    supportedChains,
    loadingChains,
    selectedChains,
    setSelectedChains,
    search,
    fetchSupportedChains
  } = useCrossChainSearch();

  // Fetch supported chains on component mount
  useEffect(() => {
    fetchSupportedChains();
  }, [fetchSupportedChains]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    search();
  };

  const toggleChain = (chain: string) => {
    if (selectedChains.includes(chain)) {
      setSelectedChains(selectedChains.filter(c => c !== chain));
    } else {
      setSelectedChains([...selectedChains, chain]);
    }
  };

  const selectAllChains = () => {
    setSelectedChains([...supportedChains]);
  };

  const clearAllChains = () => {
    setSelectedChains([]);
  };

  return (
    <div className="mb-8">
      <h2 className="text-xl font-bold text-gray-900 mb-4">Cross-Chain Address Search</h2>
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label htmlFor="fragments" className="block text-sm font-medium text-gray-700 mb-1">
            Address Fragments (space or comma separated)
          </label>
          <div className="mt-1 relative rounded-md shadow-sm">
            <input
              type="text"
              id="fragments"
              value={fragments}
              onChange={(e) => setFragments(e.target.value)}
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm font-mono"
              placeholder="Enter address fragments (e.g. d389Cc 06E3)"
              spellCheck={false}
              autoComplete="off"
            />
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center">
              <svg className="h-5 w-5 text-gray-400" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          <p className="mt-1 text-xs text-gray-500">
            Enter 1 or more fragments to find addresses across all chains
          </p>
        </div>
        
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="block text-sm font-medium text-gray-700">
              Blockchains to Search
            </label>
            <div className="space-x-2">
              <button
                type="button"
                onClick={selectAllChains}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                Select All
              </button>
              <button
                type="button"
                onClick={clearAllChains}
                className="text-xs text-primary-600 hover:text-primary-800"
              >
                Clear All
              </button>
            </div>
          </div>
          
          {loadingChains ? (
            <div className="animate-pulse flex space-x-2">
              {[1, 2, 3, 4, 5].map(i => (
                <div key={i} className="h-8 w-20 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : (
            <div className="flex flex-wrap gap-2">
              {supportedChains.map(chain => (
                <button
                  key={chain}
                  type="button"
                  onClick={() => toggleChain(chain)}
                  className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                    selectedChains.includes(chain)
                      ? 'bg-primary-100 text-primary-800'
                      : 'bg-gray-100 text-gray-600'
                  }`}
                >
                  {chain}
                  {selectedChains.includes(chain) && (
                    <svg className="ml-1.5 h-3 w-3" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                  )}
                </button>
              ))}
              
              {supportedChains.length === 0 && (
                <p className="text-sm text-gray-500">No blockchains found</p>
              )}
            </div>
          )}
          <p className="mt-1 text-xs text-gray-500">
            {selectedChains.length === 0 
              ? 'No blockchains selected'
              : `Searching across ${selectedChains.length} blockchain${selectedChains.length > 1 ? 's' : ''}`}
          </p>
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading || fragments.trim() === '' || selectedChains.length === 0}
            className={`inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 ${
              loading || fragments.trim() === '' || selectedChains.length === 0
                ? 'opacity-50 cursor-not-allowed'
                : ''
            }`}
          >
            {loading ? 'Searching...' : 'Search Across Chains'}
          </button>
        </div>
      </form>
      
      <div className="mt-3 text-xs text-gray-500 space-y-1">
        <div>
          <span className="font-medium">Examples:</span>
        </div>
        <div>
          <span className="font-mono">• Single fragment: d389Cc</span>
        </div>
        <div>
          <span className="font-mono">• Multiple fragments: 06E3, 13D0</span> <span className="text-gray-500">(finds addresses containing both)</span>
        </div>
        <div>
          <span className="text-gray-500">All searches are converted to lowercase for consistency</span>
        </div>
      </div>
    </div>
  );
};

export default CrossChainSearchBar; 