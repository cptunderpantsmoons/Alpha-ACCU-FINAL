import React, { useState, useEffect } from 'react';

interface Batch {
  id: string;
  batchNumber: string;
  quantity: number;
  acquisitionCost: number;
  classification: 'inventory' | 'intangible' | 'fvtpl';
  acquisitionDate: string;
  entityId: string;
  status: 'active' | 'impaired' | 'reclassified' | 'on_loan';
}

const BatchManagement: React.FC = () => {
  const [batches, setBatches] = useState<Batch[]>([]);

  useEffect(() => {
    // In a real app, you would fetch from an API endpoint like '/api/batches'
    // For now, we'll simulate a fetch with mock data to keep the display working.
    const mockData = [
      {
        id: '1',
        batchNumber: 'ACCU-001',
        quantity: 1000,
        acquisitionCost: 25.5,
        classification: 'inventory',
        acquisitionDate: '2024-01-15',
        entityId: '1',
        status: 'active',
      },
      {
        id: '2',
        batchNumber: 'ACCU-002',
        quantity: 500,
        acquisitionCost: 28.0,
        classification: 'intangible',
        acquisitionDate: '2024-02-20',
        entityId: '1',
        status: 'impaired',
      },
    ];
    setBatches(mockData);
  }, []);

  const deleteBatch = (id: string) => {
    // In a real app, this would also be an API call
    setBatches(prev => prev.filter(b => b.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-7xl mx-auto">
        <header className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Batch Management</h1>
        </header>

        {/* The form for adding new batches has been removed for now. */}

        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch Number</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Cost</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Classification</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {batches.map((batch) => (
                <tr key={batch.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{batch.batchNumber}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.quantity}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">${batch.acquisitionCost}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      batch.classification === 'inventory' ? 'bg-green-100 text-green-800' :
                      batch.classification === 'intangible' ? 'bg-blue-100 text-blue-800' : 'bg-purple-100 text-purple-800'
                    }`}>
                      {batch.classification}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{batch.acquisitionDate}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      batch.status === 'active' ? 'bg-green-100 text-green-800' :
                      batch.status === 'impaired' ? 'bg-red-100 text-red-800' :
                      batch.status === 'reclassified' ? 'bg-yellow-100 text-yellow-800' : 'bg-blue-100 text-blue-800'
                    }`}>
                      {batch.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => deleteBatch(batch.id)}
                      className="text-red-600 hover:text-red-900 mr-3"
                    >
                      Delete
                    </button>
                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default BatchManagement;