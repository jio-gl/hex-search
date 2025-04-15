import React from 'react';
import { Link } from 'react-router-dom';

const Navbar: React.FC = () => {
  return (
    <nav className="bg-white shadow-sm">
      <div className="container mx-auto px-4 py-3">
        <Link to="/" className="flex items-center">
          <h1 className="text-xl font-bold text-gray-900">HexSearch</h1>
          <span className="ml-2 px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded">Beta</span>
        </Link>
        <p className="text-sm text-gray-600 mt-1">
          Blockchain hash search engine - instantly search through Ethereum, Bitcoin, and more.
        </p>
      </div>
    </nav>
  );
};

export default Navbar; 