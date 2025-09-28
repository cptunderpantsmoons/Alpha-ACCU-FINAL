import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import Dashboard from './components/Dashboard';
import BatchManagement from './components/BatchManagement';
import LoanManagement from './components/LoanManagement';
import MarketData from './components/MarketData';
import './index.css';

function App() {
  return (
    <div className="min-h-screen bg-gray-100">
      <nav className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-gray-900">ACCU Engine</Link>
            </div>
            <div className="flex space-x-8 items-center">
              <Link to="/" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Dashboard
              </Link>
              <Link to="/batches" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Batches
              </Link>
              <Link to="/loans" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Loans
              </Link>
              <Link to="/marketdata" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Market Data
              </Link>
              <Link to="/reports" className="text-gray-700 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium">
                Reports
              </Link>
            </div>
          </div>
        </div>
      </nav>
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/batches" element={<BatchManagement />} />
        <Route path="/loans" element={<LoanManagement />} />
        <Route path="/marketdata" element={<MarketData />} />
        <Route path="/reports" element={<div className="p-6">Reports Page Placeholder</div>} />
      </Routes>
    </div>
  );
}

export default App;