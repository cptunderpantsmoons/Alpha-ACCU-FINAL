import React from 'react';
import { useAuthStore } from '../stores/authStore';

const Dashboard: React.FC = () => {
  const { user, setCurrentEntity } = useAuthStore();

  const mockEntities = [
    { id: '1', name: 'Entity A', status: 'Active' },
    { id: '2', name: 'Entity B', status: 'Active' },
    { id: '3', name: 'Entity C', status: 'Inactive' },
  ];

  const mockMetrics = {
    totalValue: '$1,250,000',
    impairedAssets: '15%',
    pendingReclass: 5,
    loanBalances: '$500,000',
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">ACCU Dashboard</h1>
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-500">
              Welcome, {user?.email || 'User'}
            </span>
            <select
              className="border border-gray-300 rounded-md p-2"
              value={user?.currentEntityId || ''}
              onChange={(e) => setCurrentEntity(e.target.value)}
            >
              <option value="">Select Entity</option>
              {mockEntities.map((entity) => (
                <option key={entity.id} value={entity.id}>
                  {entity.name} ({entity.status})
                </option>
              ))}
            </select>
          </div>
        </header>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Total Value</h2>
            <p className="text-2xl font-bold text-green-600">{mockMetrics.totalValue}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Impaired Assets</h2>
            <p className="text-2xl font-bold text-red-600">{mockMetrics.impairedAssets}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Pending Reclassifications</h2>
            <p className="text-2xl font-bold text-yellow-600">{mockMetrics.pendingReclass}</p>
          </div>
          <div className="bg-white p-6 rounded-lg shadow">
            <h2 className="text-lg font-semibold text-gray-900 mb-2">Loan Balances</h2>
            <p className="text-2xl font-bold text-blue-600">{mockMetrics.loanBalances}</p>
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <button className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-md">
              Add Batch
            </button>
            <button className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-md">
              Process NRV
            </button>
            <button className="bg-purple-500 hover:bg-purple-600 text-white px-4 py-2 rounded-md">
              View Reports
            </button>
            <button className="bg-orange-500 hover:bg-orange-600 text-white px-4 py-2 rounded-md">
              Manage Loans
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;