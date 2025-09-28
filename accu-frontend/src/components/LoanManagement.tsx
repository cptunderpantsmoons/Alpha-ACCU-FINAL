import React, { useState, useEffect } from 'react';

const LoanManagement = () => {
  const [loans, setLoans] = useState([]);

  useEffect(() => {
    fetch('/api/loans')
      .then(res => res.json())
      .then(data => setLoans(data));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Loan Management</h1>
      <div className="bg-white shadow-md rounded-lg p-4">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creditor ID</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Loan Amount</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {loans.map(loan => (
              <tr key={loan.id}>
                <td className="px-6 py-4 whitespace-nowrap">{loan.id}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.batchId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.creditorId}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.quantity}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.loanAmount}</td>
                <td className="px-6 py-4 whitespace-nowrap">{loan.loanStatus}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default LoanManagement;