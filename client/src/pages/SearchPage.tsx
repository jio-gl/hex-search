import React from 'react';
import { CrossChainSearchProvider } from '../hooks/useCrossChainSearch';
import CrossChainSearchBar from '../components/CrossChainSearchBar';
import CrossChainSearchResults from '../components/CrossChainSearchResults';
import { Toaster } from 'react-hot-toast';

const SearchPage: React.FC = () => {
  return (
    <CrossChainSearchProvider>
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <section className="bg-white p-8 rounded-lg shadow-sm">
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">Hex Search</h2>
              <p className="text-gray-600">
                Search for hex data across multiple blockchains simultaneously - Ethereum, Bitcoin, Polygon, and more.
              </p>
            </div>
            
            <CrossChainSearchBar />
            
            <div className="mt-8">
              <CrossChainSearchResults />
            </div>
          </section>
        </div>
      </div>
      <Toaster position="bottom-right" />
    </CrossChainSearchProvider>
  );
};

export default SearchPage; 