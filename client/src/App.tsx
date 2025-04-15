import React from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Navbar from './components/Navbar';
import SearchPage from './pages/SearchPage';
import './App.css';

function App() {
  return (
    <Router basename="/hex-search">
      <div className="App">
        <Navbar />
        <main className="main-content">
          <SearchPage />
        </main>
      </div>
    </Router>
  );
}

export default App;
