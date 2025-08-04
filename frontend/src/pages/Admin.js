import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  UserCheck
} from 'lucide-react';
import { adminAPI } from '../services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'withdrawals') {
      fetchPendingWithdrawals();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    }
  }, [activeTab]);

  const fetchStats = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('Failed to load platform statistics');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getUsers();
      setUsers(response.data.users);
    } catch (error) {
      console.error('Error fetching users:', error);
      setError('Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingWithdrawals = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getPendingWithdrawals();
      setPendingWithdrawals(response.data.withdrawals);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      setError('Failed to load pending withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const fetchAuditLogs = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getAuditLogs();
      setAuditLogs(response.data.logs);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      setError('Failed to load audit logs');
    } finally {
      setLoading(false);
    }
  };

  const handleKYCApproval = async (userId, status, notes = '') => {
    try {
      await adminAPI.approveKYC(userId, { status, notes });
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      console.error('KYC approval error:', error);
      setError('Failed to update KYC status');
    }
  };

  const handleWithdrawalApproval = async (withdrawalId, status, notes = '') => {
    try {
      await adminAPI.approveWithdrawal(withdrawalId, { status, notes });
      fetchPendingWithdrawals(); // 刷新提现列表
    } catch (error) {
      console.error('Withdrawal approval error:', error);
      setError('Failed to approve withdrawal');
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStatusBadge = (status) => {
    const badges = {
      approved: <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Approved</span>,
      pending: <span className="px-2 py-1 bg-yellow-100 text-yellow-800 rounded-full text-xs">Pending</span>,
      rejected: <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">Rejected</span>
    };
    return badges[status] || <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{status}</span>;
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'withdrawals', name: 'Withdrawal Approval', icon: DollarSign },
    { id: 'audit', name: 'Audit Logs', icon: Activity }
  ];

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Shield className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-secondary-dark">Admin Dashboard</h1>
        </div>
        <p className="text-secondary-dark/70">
          Manage users, approve KYC applications, and monitor platform activity
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {/* Dashboard Tab */}
      {activeTab === 'dashboard' && (
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          ) : stats ? (
            <>
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <Users className="w-8 h-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Users</p>
                      <p className="text-2xl font-bold">{stats.stats.users.total}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <UserCheck className="w-8 h-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Approved Users</p>
                      <p className="text-2xl font-bold">{stats.stats.users.approved}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <Clock className="w-8 h-8 text-yellow-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Pending KYC</p>
                      <p className="text-2xl font-bold">{stats.stats.users.pendingKYC}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <DollarSign className="w-8 h-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Total Deposits</p>
                      <p className="text-2xl font-bold">${stats.stats.financial.totalDeposits.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-white rounded-lg shadow-md">
                <div className="p-6 border-b border-gray-200">
                  <h3 className="text-lg font-semibold">Recent Activity</h3>
                </div>
                <div className="p-6">
                  {stats.recentActivity.length === 0 ? (
                    <p className="text-gray-500">No recent activity</p>
                  ) : (
                    <div className="space-y-4">
                      {stats.recentActivity.map((log) => (
                        <div key={log.id} className="flex items-center justify-between">
                          <div>
                            <p className="font-medium">{log.action}</p>
                            <p className="text-sm text-gray-600">
                              by {log.admin.email} • {formatDate(log.timestamp)}
                            </p>
                          </div>
                          <span className="text-xs text-gray-500">
                            {log.targetId ? `Target: ${log.targetId}` : ''}
                          </span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </>
          ) : null}
        </div>
      )}

      {/* Users Tab */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">User Management</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">User</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Role</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">KYC Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Balance</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((user) => (
                      <tr key={user.id} className="border-b border-gray-100">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium">{user.name}</p>
                            <p className="text-sm text-gray-600">{user.email}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-1 rounded-full text-xs ${
                            user.role === 'admin' ? 'bg-red-100 text-red-800' :
                            user.role === 'demo' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {user.role}
                          </span>
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(user.kycStatus)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">${user.usdeBalance.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">USDE</p>
                        </td>
                        <td className="py-3 px-4">
                          {user.kycStatus === 'pending' && (
                            <div className="flex space-x-2">
                              <button
                                onClick={() => handleKYCApproval(user.id, 'approved')}
                                className="px-3 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                              >
                                Approve
                              </button>
                              <button
                                onClick={() => handleKYCApproval(user.id, 'rejected')}
                                className="px-3 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                              >
                                Reject
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Withdrawals Tab */}
      {activeTab === 'withdrawals' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Pending Withdrawals</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : pendingWithdrawals.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No pending withdrawals</p>
            ) : (
              <div className="space-y-4">
                {pendingWithdrawals.map((withdrawal) => (
                  <div key={withdrawal.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{withdrawal.company.name}</p>
                        <p className="text-sm text-gray-600">{withdrawal.company.email}</p>
                        <p className="text-lg font-bold">${withdrawal.amount.toLocaleString()}</p>
                        <p className="text-xs text-gray-500">{formatDate(withdrawal.timestamp)}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleWithdrawalApproval(withdrawal.id, 'completed')}
                          className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                        >
                          Approve
                        </button>
                        <button
                          onClick={() => handleWithdrawalApproval(withdrawal.id, 'failed')}
                          className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Reject
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Audit Logs Tab */}
      {activeTab === 'audit' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Audit Logs</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : (
              <div className="space-y-4">
                {auditLogs.map((log) => (
                  <div key={log.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{log.action}</p>
                        <p className="text-sm text-gray-600">
                          by {log.admin.email} • {formatDate(log.timestamp)}
                        </p>
                        {log.targetId && (
                          <p className="text-xs text-gray-500">Target: {log.targetId}</p>
                        )}
                      </div>
                      <span className="text-xs text-gray-500">
                        {log.ipAddress ? `IP: ${log.ipAddress}` : ''}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 