import React, { useState, useEffect } from 'react';

const MarketData = () => {
  const [marketPrices, setMarketPrices] = useState([]);

  useEffect(() => {
    fetch('/api/marketdata')
      .then(res => res.json())
      .then(data => setMarketPrices(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Market Data</h1>
      <div className="bg-white shadow-md rounded-lg p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Price</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {marketPrices.map(price => (
              <tr key={price.id}>
                <td className="px-6 py-4 whitespace-nowrap">{price.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{price.price}</td>
                <td className="px-6 py-4 whitespace-nowrap">{new Date(price.date).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default MarketData;