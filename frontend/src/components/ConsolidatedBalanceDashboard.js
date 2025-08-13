import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const ConsolidatedBalanceDashboard = () => {
  const { user } = useAuth();
  const [balanceData, setBalanceData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedToken, setSelectedToken] = useState('USDE');

  useEffect(() => {
    if (user?.companyId && user?.isParentCompany) {
      fetchConsolidatedBalance();
    }
  }, [user?.companyId, user?.isParentCompany]);

  const fetchConsolidatedBalance = async () => {
    try {
      setLoading(true);
      const response = await api.get(
        `/api/companies/${user.companyId}/consolidated-balance?token=${selectedToken}`
      );
      setBalanceData(response.data);
    } catch (error) {
      console.error('Failed to fetch consolidated balance:', error);
    } finally {
      setLoading(false);
    }
  };

  if (!user?.isParentCompany) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            This dashboard is only available for parent companies.
          </p>
        </div>
      </div>
    );
  }

  const formatBalance = (balance) => {
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(balance || 0);
  };

  const getBalanceColor = (type) => {
    switch (type) {
      case 'available':
        return 'text-green-600';
      case 'locked':
        return 'text-yellow-600';
      case 'pending':
        return 'text-blue-600';
      default:
        return 'text-gray-900';
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Consolidated Balance Overview</h2>
        <div className="flex items-center space-x-4">
          <select
            value={selectedToken}
            onChange={(e) => setSelectedToken(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="USDE">USDE</option>
            <option value="UC">UC</option>
          </select>
          <button
            onClick={fetchConsolidatedBalance}
            disabled={loading}
            className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg"
          >
            {loading ? 'Refreshing...' : 'Refresh'}
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <p className="mt-4 text-gray-600">Loading consolidated balance...</p>
        </div>
      ) : balanceData ? (
        <>
          {/* Balance Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Balance</p>
                  <p className={`text-2xl font-bold ${getBalanceColor('total')}`}>
                    {formatBalance(selectedToken === 'USDE' ? balanceData.total.usdeBalance : balanceData.total.ucBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Parent Company</p>
                  <p className={`text-2xl font-bold ${getBalanceColor('available')}`}>
                    {formatBalance(selectedToken === 'USDE' ? balanceData.parentCompany.usdeBalance : balanceData.parentCompany.ucBalance)}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Subsidiaries</p>
                  <p className={`text-2xl font-bold ${getBalanceColor('available')}`}>
                    {formatBalance(
                      balanceData.subsidiaries.reduce((sum, sub) => 
                        sum + (selectedToken === 'USDE' ? sub.usdeBalance : sub.ucBalance), 0
                      )
                    )}
                  </p>
                </div>
              </div>
            </div>

            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-yellow-100 rounded-lg flex items-center justify-center">
                    <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                    </svg>
                  </div>
                </div>
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-500">Total Companies</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {1 + balanceData.subsidiaries.length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Company Breakdown */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Parent Company Details */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Parent Company: {balanceData.parentCompany.name}
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">UC Balance:</span>
                  <span className="font-medium">{formatBalance(balanceData.parentCompany.ucBalance)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">USDE Balance:</span>
                  <span className="font-medium">{formatBalance(balanceData.parentCompany.usdeBalance)}</span>
                </div>
              </div>
            </div>

            {/* Subsidiaries Summary */}
            <div className="bg-white border border-gray-200 rounded-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Subsidiaries Summary
              </h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-gray-600">Total Subsidiaries:</span>
                  <span className="font-medium">{balanceData.subsidiaries.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total UC:</span>
                  <span className="font-medium">
                    {formatBalance(
                      balanceData.subsidiaries.reduce((sum, sub) => sum + sub.ucBalance, 0)
                    )}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Total USDE:</span>
                  <span className="font-medium">
                    {formatBalance(
                      balanceData.subsidiaries.reduce((sum, sub) => sum + sub.usdeBalance, 0)
                    )}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Subsidiaries List */}
          {balanceData.subsidiaries.length > 0 && (
            <div className="bg-white border border-gray-200 rounded-lg">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  Subsidiary Details
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Company Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        UC Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        USDE Balance
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {balanceData.subsidiaries.map((subsidiary) => (
                      <tr key={subsidiary.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">
                            {subsidiary.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {subsidiary.companyCode}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBalance(subsidiary.ucBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatBalance(subsidiary.usdeBalance)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            subsidiary.kycStatus === 'approved' 
                              ? 'bg-green-100 text-green-800'
                              : subsidiary.kycStatus === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {subsidiary.kycStatus}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-12">
          <p className="text-gray-500">No balance data available</p>
        </div>
      )}
    </div>
  );
};

export default ConsolidatedBalanceDashboard;

