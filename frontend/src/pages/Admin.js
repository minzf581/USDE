import React, { useState, useEffect } from 'react';
import { 
  Shield, 
  Users, 
  DollarSign, 
  TrendingUp, 
  Activity,
  Clock,
  UserCheck,
  Trash2,
  Edit,
  Eye,
  Building,
  User,
  FileText,
  CheckCircle,
  XCircle
} from 'lucide-react';
import { adminAPI } from '../services/api';

const Admin = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [pendingWithdrawals, setPendingWithdrawals] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [kycApplications, setKycApplications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedUser, setSelectedUser] = useState(null);
  const [showUserModal, setShowUserModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [showKycModal, setShowKycModal] = useState(false);
  const [selectedKyc, setSelectedKyc] = useState(null);
  const [rejectReason, setRejectReason] = useState('');

  useEffect(() => {
    if (activeTab === 'dashboard') {
      fetchStats();
    } else if (activeTab === 'users') {
      fetchUsers();
    } else if (activeTab === 'withdrawals') {
      fetchPendingWithdrawals();
    } else if (activeTab === 'audit') {
      fetchAuditLogs();
    } else if (activeTab === 'kyc') {
      fetchKycApplications();
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

  const fetchKycApplications = async () => {
    try {
      setLoading(true);
      const response = await adminAPI.getKycApplications();
      setKycApplications(response.data.applications);
    } catch (error) {
      console.error('Error fetching KYC applications:', error);
      setError('Failed to load KYC applications');
    } finally {
      setLoading(false);
    }
  };

  const handleKYCApproval = async (userId, status, notes = '') => {
    try {
      await adminAPI.approveKYC(userId, { status, notes });
      fetchUsers(); // 刷新用户列表
      if (activeTab === 'kyc') {
        fetchKycApplications(); // 刷新KYC申请列表
      }
    } catch (error) {
      console.error('KYC approval error:', error);
      setError('Failed to update KYC status');
    }
  };

  const handleKycModalApproval = async (status) => {
    if (!selectedKyc) return;
    
    try {
      const notes = status === 'rejected' ? rejectReason : '';
      await adminAPI.approveKYC(selectedKyc.id, { status, notes });
      setShowKycModal(false);
      setSelectedKyc(null);
      setRejectReason('');
      fetchKycApplications();
    } catch (error) {
      console.error('KYC approval error:', error);
      setError('Failed to update KYC status');
    }
  };

  const handleViewKycDetails = (kycApplication) => {
    setSelectedKyc(kycApplication);
    setShowKycModal(true);
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

  const handleViewUserDetails = async (userId) => {
    try {
      const response = await adminAPI.getUserDetails(userId);
      setSelectedUser(response.data.user);
      setShowUserModal(true);
    } catch (error) {
      console.error('Error fetching user details:', error);
      setError('Failed to load user details');
    }
  };

  const handleDeleteUser = async () => {
    if (!userToDelete) return;
    
    try {
      await adminAPI.deleteUser(userToDelete.id);
      setShowDeleteModal(false);
      setUserToDelete(null);
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      console.error('Error deleting user:', error);
      setError('Failed to delete user');
    }
  };

  const handleUpdateUser = async (userId, updateData) => {
    try {
      await adminAPI.updateUser(userId, updateData);
      setShowUserModal(false);
      setSelectedUser(null);
      fetchUsers(); // 刷新用户列表
    } catch (error) {
      console.error('Error updating user:', error);
      setError('Failed to update user');
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

  const getRoleBadge = (role) => {
    const badges = {
      system_admin: <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs">System Admin</span>,
      enterprise_admin: <span className="px-2 py-1 bg-blue-100 text-blue-800 rounded-full text-xs">Enterprise Admin</span>,
      enterprise_user: <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs">Enterprise User</span>
    };
    return badges[role] || <span className="px-2 py-1 bg-gray-100 text-gray-800 rounded-full text-xs">{role}</span>;
  };

  const tabs = [
    { id: 'dashboard', name: 'Dashboard', icon: TrendingUp },
    { id: 'users', name: 'User Management', icon: Users },
    { id: 'kyc', name: 'KYC Approval', icon: FileText },
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

              {/* Role Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <Shield className="w-8 h-8 text-red-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">System Admins</p>
                      <p className="text-2xl font-bold">{stats.stats.users.systemAdmins}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <Building className="w-8 h-8 text-blue-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Enterprise Admins</p>
                      <p className="text-2xl font-bold">{stats.stats.users.enterpriseAdmins}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="flex items-center">
                    <User className="w-8 h-8 text-green-500 mr-3" />
                    <div>
                      <p className="text-sm text-gray-600">Enterprise Users</p>
                      <p className="text-2xl font-bold">{stats.stats.users.enterpriseUsers}</p>
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
                            {user.companyName && (
                              <p className="text-xs text-gray-500">{user.companyName}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          {getRoleBadge(user.role)}
                        </td>
                        <td className="py-3 px-4">
                          {getStatusBadge(user.kycStatus)}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium">${user.usdeBalance.toLocaleString()}</p>
                          <p className="text-sm text-gray-600">USDE</p>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex space-x-2">
                            <button
                              onClick={() => handleViewUserDetails(user.id)}
                              className="p-1 text-blue-600 hover:text-blue-800"
                              title="View Details"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {user.role !== 'system_admin' && (
                              <>
                                <button
                                  onClick={() => {
                                    setSelectedUser(user);
                                    setShowUserModal(true);
                                  }}
                                  className="p-1 text-green-600 hover:text-green-800"
                                  title="Edit User"
                                >
                                  <Edit className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => {
                                    setUserToDelete(user);
                                    setShowDeleteModal(true);
                                  }}
                                  className="p-1 text-red-600 hover:text-red-800"
                                  title="Delete User"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                            {user.kycStatus === 'pending' && (
                              <div className="flex space-x-1">
                                <button
                                  onClick={() => handleKYCApproval(user.id, 'approved')}
                                  className="px-2 py-1 bg-green-500 text-white rounded text-xs hover:bg-green-600"
                                >
                                  Approve
                                </button>
                                <button
                                  onClick={() => handleKYCApproval(user.id, 'rejected')}
                                  className="px-2 py-1 bg-red-500 text-white rounded text-xs hover:bg-red-600"
                                >
                                  Reject
                                </button>
                              </div>
                            )}
                          </div>
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

      {/* KYC Approval Tab */}
      {activeTab === 'kyc' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">KYC Approval</h3>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : kycApplications.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No KYC applications found</p>
            ) : (
              <div className="space-y-4">
                {kycApplications.map((application) => (
                  <div key={application.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{application.user.name}</p>
                        <p className="text-sm text-gray-600">{application.user.email}</p>
                        {application.user.companyName && (
                          <p className="text-sm text-gray-500">{application.user.companyName}</p>
                        )}
                        <p className="text-xs text-gray-500">{formatDate(application.submittedAt)}</p>
                        {getStatusBadge(application.status)}
                        {getRoleBadge(application.user.role)}
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => handleViewKycDetails(application)}
                          className="p-1 text-blue-600 hover:text-blue-800"
                          title="View Details"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        {application.status === 'pending' && (
                          <>
                            <button
                              onClick={() => handleKycModalApproval('approved')}
                              className="p-1 text-green-600 hover:text-green-800"
                              title="Approve KYC"
                            >
                              <CheckCircle className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => {
                                setSelectedKyc(application);
                                setRejectReason('');
                                setShowKycModal(true);
                              }}
                              className="p-1 text-red-600 hover:text-red-800"
                              title="Reject KYC"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
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
                        {getRoleBadge(withdrawal.company.role)}
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
                          by {log.admin.email} ({log.admin.role}) • {formatDate(log.timestamp)}
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

      {/* User Details Modal */}
      {showUserModal && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">User Details</h3>
              <button
                onClick={() => {
                  setShowUserModal(false);
                  setSelectedUser(null);
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">Name:</span> {selectedUser.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedUser.email}</p>
                  <p><span className="font-medium">Role:</span> {selectedUser.role}</p>
                  <p><span className="font-medium">KYC Status:</span> {selectedUser.kycStatus}</p>
                  <p><span className="font-medium">Active:</span> {selectedUser.isActive ? 'Yes' : 'No'}</p>
                  <p><span className="font-medium">Created:</span> {formatDate(selectedUser.createdAt)}</p>
                </div>
              </div>

              {/* Financial Information */}
              <div>
                <h4 className="font-medium mb-3">Financial Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">USDE Balance:</span> ${selectedUser.usdeBalance.toLocaleString()}</p>
                  <p><span className="font-medium">UC Balance:</span> ${selectedUser.ucBalance.toLocaleString()}</p>
                  <p><span className="font-medium">Total Earnings:</span> ${selectedUser.totalEarnings.toLocaleString()}</p>
                </div>
              </div>

              {/* Recent Activity */}
              <div className="md:col-span-2">
                <h4 className="font-medium mb-3">Recent Activity</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <h5 className="font-medium text-sm mb-2">Recent Deposits</h5>
                    <div className="space-y-1">
                      {selectedUser.deposits?.map((deposit) => (
                        <div key={deposit.id} className="text-sm">
                          ${deposit.amount.toLocaleString()} - {formatDate(deposit.timestamp)}
                        </div>
                      ))}
                    </div>
                  </div>
                  <div>
                    <h5 className="font-medium text-sm mb-2">Recent Withdrawals</h5>
                    <div className="space-y-1">
                      {selectedUser.withdrawals?.map((withdrawal) => (
                        <div key={withdrawal.id} className="text-sm">
                          ${withdrawal.amount.toLocaleString()} - {formatDate(withdrawal.timestamp)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* KYC Details Modal */}
      {showKycModal && selectedKyc && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold">KYC Details</h3>
              <button
                onClick={() => {
                  setShowKycModal(false);
                  setSelectedKyc(null);
                  setRejectReason('');
                }}
                className="text-gray-500 hover:text-gray-700"
              >
                ×
              </button>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Basic Information */}
              <div>
                <h4 className="font-medium mb-3">Basic Information</h4>
                <div className="space-y-2">
                  <p><span className="font-medium">User:</span> {selectedKyc.user.name}</p>
                  <p><span className="font-medium">Email:</span> {selectedKyc.user.email}</p>
                  <p><span className="font-medium">Role:</span> {selectedKyc.user.role}</p>
                  <p><span className="font-medium">Status:</span> {selectedKyc.status}</p>
                  <p><span className="font-medium">Submitted:</span> {formatDate(selectedKyc.submittedAt)}</p>
                  {selectedKyc.user.companyName && (
                    <p><span className="font-medium">Company:</span> {selectedKyc.user.companyName}</p>
                  )}
                  {selectedKyc.user.enterpriseCompanyType && (
                    <p><span className="font-medium">Company Type:</span> {selectedKyc.user.enterpriseCompanyType}</p>
                  )}
                </div>
              </div>

              {/* KYC Documents */}
              <div>
                <h4 className="font-medium mb-3">KYC Documents</h4>
                <div className="space-y-2">
                  {selectedKyc.documents && selectedKyc.documents.length > 0 ? (
                    <div className="space-y-2">
                      {selectedKyc.documents.map((doc, index) => (
                        <div key={index} className="bg-gray-100 p-3 rounded-md">
                          <div className="flex items-center mb-2">
                            <FileText className="w-5 h-5 text-gray-600 mr-2" />
                            <span className="text-sm font-medium">{doc.name}</span>
                          </div>
                          {doc.details && (
                            <div className="text-xs text-gray-600 space-y-1">
                              <p><span className="font-medium">Nationality:</span> {doc.details.nationality}</p>
                              <p><span className="font-medium">Address:</span> {doc.details.address}</p>
                              <p><span className="font-medium">Ownership:</span> {doc.details.ownershipPercentage}%</p>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">No documents uploaded.</p>
                  )}
                </div>
              </div>

              {/* Review History */}
              <div className="md:col-span-2">
                <h4 className="font-medium mb-3">Review History</h4>
                <div className="space-y-2">
                  {selectedKyc.lastReview ? (
                    <div className="bg-gray-50 p-3 rounded-md">
                      <p><span className="font-medium">Last Review:</span> {formatDate(selectedKyc.lastReview.reviewedAt)}</p>
                      <p><span className="font-medium">Reviewer ID:</span> {selectedKyc.lastReview.reviewerId || 'N/A'}</p>
                      <p><span className="font-medium">Status:</span> {selectedKyc.lastReview.status}</p>
                      {selectedKyc.lastReview.notes && (
                        <p><span className="font-medium">Notes:</span> {selectedKyc.lastReview.notes}</p>
                      )}
                    </div>
                  ) : (
                    <p className="text-gray-500">No previous reviews.</p>
                  )}
                </div>
              </div>

              {/* Reject Reason Input */}
              {selectedKyc.status === 'pending' && (
                <div className="md:col-span-2">
                  <h4 className="font-medium mb-3">Reject Reason (Optional)</h4>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="Enter reason for rejection..."
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    rows="3"
                  />
                </div>
              )}
            </div>

            {selectedKyc.status === 'pending' && (
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => handleKycModalApproval('approved')}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                >
                  Approve KYC
                </button>
                <button
                  onClick={() => handleKycModalApproval('rejected')}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Reject KYC
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && userToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Confirm Delete</h3>
            <p className="mb-4">
              Are you sure you want to delete user <strong>{userToDelete.name}</strong> ({userToDelete.email})?
              This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDeleteUser}
                className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setUserToDelete(null);
                }}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Admin; 