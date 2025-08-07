import React, { useState, useEffect } from 'react';
import { dashboardAPI } from '../services/api';
import { api } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { 
  DollarSign, 
  TrendingUp, 
  Lock, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle,
  Shield
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  
  // Treasury Control data
  const [approvals, setApprovals] = useState([]);
  const [reports, setReports] = useState(null);
  const [logs, setLogs] = useState([]);

  // Check if user has approval permissions
  const hasApprovalPermissions = user?.role === 'enterprise_admin' || user?.role === 'enterprise_finance_manager';

  useEffect(() => {
    fetchDashboardData();
    if (hasApprovalPermissions) {
      loadTreasuryData();
    }
  }, [hasApprovalPermissions]);

  const fetchDashboardData = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setDashboardData(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadTreasuryData = async () => {
    try {
      // Load approvals
      const approvalsResponse = await api.get('/treasury/approvals');
      setApprovals(approvalsResponse.data);

      // Load reports
      const currentDate = new Date();
      const reportsResponse = await api.get(`/treasury/reports/monthly?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
      setReports(reportsResponse.data);

      // Load logs
      const logsResponse = await api.get('/treasury/logs');
      setLogs(logsResponse.data);
    } catch (error) {
      console.error('Error loading treasury data:', error);
    }
  };

  const handleApprove = async (workflowId, notes = '') => {
    try {
      await api.post(`/treasury/approvals/${workflowId}/approve`, { notes });
      await loadTreasuryData();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (workflowId, notes = '') => {
    try {
      await api.post(`/treasury/approvals/${workflowId}/reject`, { notes });
      await loadTreasuryData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  if (!dashboardData) {
    return (
      <div className="p-6">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-secondary-dark mb-2">Failed to load dashboard</h3>
          <p className="text-secondary-dark/70">Please try refreshing the page.</p>
        </div>
      </div>
    );
  }

  const { company, overview, statistics, recentActivities } = dashboardData;

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const getKYCStatusColor = (status) => {
    switch (status) {
      case 'approved':
        return 'text-green-600 bg-green-100';
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getKYCStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="w-4 h-4" />;
      case 'pending':
        return <Clock className="w-4 h-4" />;
      case 'rejected':
        return <AlertCircle className="w-4 h-4" />;
      default:
        return <Clock className="w-4 h-4" />;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-secondary-dark">Dashboard</h1>
          <p className="text-secondary-dark/70">Welcome back, {company?.name}</p>
        </div>
        <div className={`px-3 py-1 rounded-full flex items-center space-x-2 ${getKYCStatusColor(company?.kycStatus)}`}>
          {getKYCStatusIcon(company?.kycStatus)}
          <span className="text-sm font-medium capitalize">{company?.kycStatus}</span>
        </div>
      </div>

      {/* Approval Section - Prominent Display - Only for users with approval permissions */}
      {hasApprovalPermissions && approvals.length > 0 && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <Shield className="w-6 h-6 text-yellow-600" />
              <h2 className="text-lg font-semibold text-yellow-800">Pending Approvals</h2>
            </div>
            <span className="bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
              {approvals.length} pending
            </span>
          </div>
          
          <div className="space-y-3">
            {approvals.slice(0, 3).map((approval) => (
              <div key={approval.id} className="bg-white p-4 rounded-lg border border-yellow-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">{approval.type.toUpperCase()}</p>
                    <p className="text-sm text-gray-500">Request ID: {approval.requestId}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(approval.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleApprove(approval.id)}
                      className="px-3 py-1 bg-green-600 text-white text-sm rounded hover:bg-green-700"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => handleReject(approval.id)}
                      className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700"
                    >
                      Reject
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {approvals.length > 3 && (
              <p className="text-sm text-yellow-700 text-center">
                +{approvals.length - 3} more approvals pending
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-dark/70">Total Balance</p>
              <p className="text-2xl font-bold text-secondary-dark">{formatCurrency(overview.totalBalance)}</p>
            </div>
            <div className="w-12 h-12 bg-primary/10 rounded-lg flex items-center justify-center">
              <DollarSign className="w-6 h-6 text-primary" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-dark/70">Available Balance</p>
              <p className="text-2xl font-bold text-secondary-dark">{formatCurrency(overview.availableBalance)}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Wallet className="w-6 h-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-dark/70">Locked Amount</p>
              <p className="text-2xl font-bold text-secondary-dark">{formatCurrency(overview.lockedAmount)}</p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Lock className="w-6 h-6 text-yellow-600" />
            </div>
          </div>
        </div>

        <div className="card">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-secondary-dark/70">Total Earnings</p>
              <p className="text-2xl font-bold text-secondary-dark">{formatCurrency(overview.totalEarnings)}</p>
            </div>
            <div className="w-12 h-12 bg-accent-orange/10 rounded-lg flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-accent-orange" />
            </div>
          </div>
        </div>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Payment Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Total Payments</span>
              <span className="font-medium">{statistics.payments.count}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Total Amount</span>
              <span className="font-medium">{formatCurrency(statistics.payments.total)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Stake Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Active Stakes</span>
              <span className="font-medium">{overview.activeStakesCount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Total Staked</span>
              <span className="font-medium">{formatCurrency(statistics.stakes.total)}</span>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Earnings Statistics</h3>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Daily Earnings</span>
              <span className="font-medium">{formatCurrency(overview.currentDailyEarnings)}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-secondary-dark/70">Total Earnings</span>
              <span className="font-medium">{formatCurrency(statistics.earnings.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Recent Payments</h3>
          <div className="space-y-3">
            {recentActivities.payments.length > 0 ? (
              recentActivities.payments.map((payment) => (
                <div key={payment.id} className="flex items-center justify-between p-3 bg-secondary-light rounded-lg">
                  <div className="flex items-center space-x-3">
                    {payment.type === 'sent' ? (
                      <ArrowUpRight className="w-5 h-5 text-red-500" />
                    ) : (
                      <ArrowDownLeft className="w-5 h-5 text-green-500" />
                    )}
                    <div>
                      <p className="font-medium text-secondary-dark">
                        {payment.type === 'sent' ? 'Sent to' : 'Received from'} {payment.counterparty.name}
                      </p>
                      <p className="text-sm text-secondary-dark/70">
                        {new Date(payment.timestamp).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-medium text-secondary-dark">{formatCurrency(payment.amount)}</p>
                    <p className="text-sm text-secondary-dark/70">
                      {payment.released ? 'Released' : 'Locked'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary-dark/70 text-center py-4">No recent payments</p>
            )}
          </div>
        </div>

        <div className="card">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Recent Stakes</h3>
          <div className="space-y-3">
            {recentActivities.stakes.length > 0 ? (
              recentActivities.stakes.map((stake) => (
                <div key={stake.id} className="flex items-center justify-between p-3 bg-secondary-light rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Lock className="w-5 h-5 text-primary" />
                    <div>
                      <p className="font-medium text-secondary-dark">{formatCurrency(stake.amount)}</p>
                      <p className="text-sm text-secondary-dark/70">
                        {(stake.interestRate * 100).toFixed(2)}% APY
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-secondary-dark/70">
                      {stake.unlocked ? 'Unlocked' : 'Active'}
                    </p>
                    <p className="text-xs text-secondary-dark/50">
                      Ends {new Date(stake.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-secondary-dark/70 text-center py-4">No recent stakes</p>
            )}
          </div>
        </div>
      </div>

      {/* Treasury Control Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('overview')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'overview'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Overview
            </button>
            <button
              onClick={() => setActiveTab('reports')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'reports'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Reports
            </button>
            <button
              onClick={() => setActiveTab('logs')}
              className={`py-4 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'logs'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Audit Logs
            </button>
          </nav>
        </div>

        <div className="p-6">
          {activeTab === 'overview' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Treasury Overview</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-blue-900">Total Assets</h4>
                  <p className="text-2xl font-bold text-blue-600">$0.00</p>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-green-900">Monthly Payments</h4>
                  <p className="text-2xl font-bold text-green-600">$0.00</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <h4 className="text-sm font-medium text-yellow-900">Monthly Withdrawals</h4>
                  <p className="text-2xl font-bold text-yellow-600">$0.00</p>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'reports' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Financial Reports</h3>
              {reports ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-blue-900">Total Payments</h4>
                    <p className="text-2xl font-bold text-blue-600">${reports.totalPayments?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-blue-500">{reports.paymentCount || 0} transactions</p>
                  </div>
                  
                  <div className="bg-green-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-green-900">Total Deposits</h4>
                    <p className="text-2xl font-bold text-green-600">${reports.totalDeposits?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-green-500">{reports.depositCount || 0} transactions</p>
                  </div>
                  
                  <div className="bg-yellow-50 p-4 rounded-lg">
                    <h4 className="text-sm font-medium text-yellow-900">Total Withdrawals</h4>
                    <p className="text-2xl font-bold text-yellow-600">${reports.totalWithdrawals?.toFixed(2) || '0.00'}</p>
                    <p className="text-sm text-yellow-500">{reports.withdrawalCount || 0} transactions</p>
                  </div>
                </div>
              ) : (
                <p className="text-gray-500 text-center py-8">No reports available</p>
              )}
            </div>
          )}

          {activeTab === 'logs' && (
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Audit Logs</h3>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Admin</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Target</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {logs.length > 0 ? (
                      logs.map((log) => (
                        <tr key={log.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {new Date(log.timestamp).toLocaleString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {log.admin?.name || 'Unknown'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.action}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.targetId || 'N/A'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {log.ipAddress || 'N/A'}
                          </td>
                        </tr>
                      ))
                    ) : (
                      <tr>
                        <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                          No logs available
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard; 