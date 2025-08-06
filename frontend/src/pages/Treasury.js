import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Treasury = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState(null);
  const [users, setUsers] = useState([]);
  const [approvals, setApprovals] = useState([]);
  const [settings, setSettings] = useState(null);
  const [logs, setLogs] = useState([]);
  const [reports, setReports] = useState(null);

  useEffect(() => {
    loadInitialData();
  }, [loadInitialData]);

  const loadInitialData = useCallback(async () => {
    try {
      setLoading(true);
      await Promise.all([
        loadDashboardData(),
        loadUserRoles(),
        loadSettings()
      ]);
    } catch (error) {
      console.error('Error loading initial data:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await api.get('/treasury/dashboard');
      setDashboardData(response.data);
    } catch (error) {
      console.error('Error loading dashboard:', error);
    }
  };

  const loadUserRoles = async () => {
    try {
      const response = await api.get('/treasury/users');
      setUsers(response.data);
    } catch (error) {
      console.error('Error loading users:', error);
    }
  };

  const loadApprovals = async () => {
    try {
      const response = await api.get('/treasury/approvals');
      setApprovals(response.data);
    } catch (error) {
      console.error('Error loading approvals:', error);
    }
  };

  const loadSettings = async () => {
    try {
      const response = await api.get('/treasury/settings');
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const loadLogs = async () => {
    try {
      const response = await api.get('/treasury/logs');
      setLogs(response.data);
    } catch (error) {
      console.error('Error loading logs:', error);
    }
  };

  const loadReports = async () => {
    try {
      const currentDate = new Date();
      const response = await api.get(`/treasury/reports/monthly?month=${currentDate.getMonth() + 1}&year=${currentDate.getFullYear()}`);
      setReports(response.data);
    } catch (error) {
      console.error('Error loading reports:', error);
    }
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
    if (tab === 'approvals') {
      loadApprovals();
    } else if (tab === 'logs') {
      loadLogs();
    } else if (tab === 'reports') {
      loadReports();
    }
  };

  const handleApprove = async (workflowId, notes = '') => {
    try {
      await api.post(`/treasury/approvals/${workflowId}/approve`, { notes });
      await loadApprovals();
      await loadDashboardData();
    } catch (error) {
      console.error('Error approving request:', error);
    }
  };

  const handleReject = async (workflowId, notes = '') => {
    try {
      await api.post(`/treasury/approvals/${workflowId}/reject`, { notes });
      await loadApprovals();
      await loadDashboardData();
    } catch (error) {
      console.error('Error rejecting request:', error);
    }
  };

  const handleUpdateSettings = async (newSettings) => {
    try {
      const response = await api.post('/treasury/settings', newSettings);
      setSettings(response.data);
    } catch (error) {
      console.error('Error updating settings:', error);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Treasury Control</h1>
          <p className="mt-2 text-gray-600">Enterprise financial management and control</p>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-8">
          <nav className="-mb-px flex space-x-8">
            {['dashboard', 'users', 'approvals', 'settings', 'reports', 'logs'].map((tab) => (
              <button
                key={tab}
                onClick={() => handleTabChange(tab)}
                className={`py-2 px-1 border-b-2 font-medium text-sm capitalize ${
                  activeTab === tab
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>

        {/* Tab Content */}
        <div className="bg-white rounded-lg shadow">
          {activeTab === 'dashboard' && (
            <DashboardTab data={dashboardData} />
          )}
          {activeTab === 'users' && (
            <UsersTab users={users} onUserUpdate={loadUserRoles} />
          )}
          {activeTab === 'approvals' && (
            <ApprovalsTab 
              approvals={approvals} 
              onApprove={handleApprove}
              onReject={handleReject}
            />
          )}
          {activeTab === 'settings' && (
            <SettingsTab settings={settings} onUpdate={handleUpdateSettings} />
          )}
          {activeTab === 'reports' && (
            <ReportsTab reports={reports} />
          )}
          {activeTab === 'logs' && (
            <LogsTab logs={logs} />
          )}
        </div>
      </div>
    </div>
  );
};

// Dashboard Tab Component
const DashboardTab = ({ data }) => {
  if (!data) return <div className="p-6">Loading dashboard...</div>;

  return (
    <div className="p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-blue-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900">Total Assets</h3>
          <p className="text-3xl font-bold text-blue-600">${data.treasury.totalAssets.toFixed(2)}</p>
        </div>
        <div className="bg-green-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-green-900">Monthly Payments</h3>
          <p className="text-3xl font-bold text-green-600">${data.treasury.monthlyPayments.toFixed(2)}</p>
        </div>
        <div className="bg-yellow-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-900">Monthly Withdrawals</h3>
          <p className="text-3xl font-bold text-yellow-600">${data.treasury.monthlyWithdrawals.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg">
          <h3 className="text-lg font-medium text-red-900">Pending Approvals</h3>
          <p className="text-3xl font-bold text-red-600">{data.pendingApprovals}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Recent Transactions</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            {data.recentTransactions.map((tx, index) => (
              <div key={index} className="flex justify-between items-center py-2 border-b border-gray-200 last:border-b-0">
                <div>
                  <p className="font-medium">{tx.type}</p>
                  <p className="text-sm text-gray-500">{new Date(tx.timestamp).toLocaleDateString()}</p>
                </div>
                <span className={`font-bold ${tx.amount > 0 ? 'text-green-600' : 'text-red-600'}`}>
                  ${tx.amount.toFixed(2)}
                </span>
              </div>
            ))}
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
          <div className="bg-gray-50 rounded-lg p-4">
            <p><strong>Name:</strong> {data.user.name}</p>
            <p><strong>Email:</strong> {data.user.email}</p>
            <p><strong>Enterprise:</strong> {data.user.isEnterprise ? 'Yes' : 'No'}</p>
            <p><strong>Roles:</strong> {data.user.roles.join(', ')}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Users Tab Component
const UsersTab = ({ users, onUserUpdate }) => {
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    password: '',
    roleName: 'finance_operator'
  });

  const handleCreateUser = async (e) => {
    e.preventDefault();
    try {
      await api.post('/treasury/users', newUser);
      setNewUser({ name: '', email: '', password: '', roleName: 'finance_operator' });
      setShowCreateForm(false);
      onUserUpdate();
    } catch (error) {
      console.error('Error creating user:', error);
    }
  };

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">User Management</h2>
        <button
          onClick={() => setShowCreateForm(!showCreateForm)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
        >
          {showCreateForm ? 'Cancel' : 'Create User'}
        </button>
      </div>

      {showCreateForm && (
        <form onSubmit={handleCreateUser} className="mb-6 p-4 bg-gray-50 rounded-lg">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Name"
              value={newUser.name}
              onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="email"
              placeholder="Email"
              value={newUser.email}
              onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={newUser.password}
              onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
              className="p-2 border rounded"
              required
            />
            <select
              value={newUser.roleName}
              onChange={(e) => setNewUser({ ...newUser, roleName: e.target.value })}
              className="p-2 border rounded"
            >
              <option value="admin">Admin</option>
              <option value="finance_manager">Finance Manager</option>
              <option value="finance_operator">Finance Operator</option>
              <option value="observer">Observer</option>
            </select>
          </div>
          <button
            type="submit"
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          >
            Create User
          </button>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">KYC Status</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roles</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {users.map((user) => (
              <tr key={user.id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.kycStatus === 'approved' ? 'bg-green-100 text-green-800' :
                    user.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {user.kycStatus}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {user.roles.join(', ')}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {user.isActive ? 'Active' : 'Inactive'}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

// Approvals Tab Component
const ApprovalsTab = ({ approvals, onApprove, onReject }) => {
  const [selectedApproval, setSelectedApproval] = useState(null);
  const [notes, setNotes] = useState('');

  const handleAction = async (action) => {
    if (!selectedApproval) return;
    
    if (action === 'approve') {
      await onApprove(selectedApproval.id, notes);
    } else {
      await onReject(selectedApproval.id, notes);
    }
    
    setSelectedApproval(null);
    setNotes('');
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Approval Center</h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Pending Approvals</h3>
          <div className="space-y-4">
            {approvals.map((approval) => (
              <div
                key={approval.id}
                className={`p-4 border rounded-lg cursor-pointer ${
                  selectedApproval?.id === approval.id ? 'border-blue-500 bg-blue-50' : 'border-gray-200'
                }`}
                onClick={() => setSelectedApproval(approval)}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <p className="font-medium">{approval.type.toUpperCase()}</p>
                    <p className="text-sm text-gray-500">Request ID: {approval.requestId}</p>
                    <p className="text-sm text-gray-500">
                      Created: {new Date(approval.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span className="px-2 py-1 text-xs bg-yellow-100 text-yellow-800 rounded-full">
                    Pending
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {selectedApproval && (
          <div>
            <h3 className="text-lg font-medium text-gray-900 mb-4">Approval Details</h3>
            <div className="bg-gray-50 p-4 rounded-lg">
              <p><strong>Type:</strong> {selectedApproval.type}</p>
              <p><strong>Request ID:</strong> {selectedApproval.requestId}</p>
              <p><strong>Status:</strong> {selectedApproval.status}</p>
              <p><strong>Current Step:</strong> {selectedApproval.currentStep} / {selectedApproval.totalSteps}</p>
              
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full p-2 border rounded"
                  rows="3"
                  placeholder="Add approval notes..."
                />
              </div>
              
              <div className="mt-4 flex space-x-2">
                <button
                  onClick={() => handleAction('approve')}
                  className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleAction('reject')}
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
                >
                  Reject
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab = ({ settings, onUpdate }) => {
  const [formData, setFormData] = useState(settings || {});

  const handleSubmit = (e) => {
    e.preventDefault();
    onUpdate(formData);
  };

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Treasury Settings</h2>
      
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Monthly Budget</label>
            <input
              type="number"
              value={formData.monthlyBudget || 0}
              onChange={(e) => setFormData({ ...formData, monthlyBudget: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Quarterly Budget</label>
            <input
              type="number"
              value={formData.quarterlyBudget || 0}
              onChange={(e) => setFormData({ ...formData, quarterlyBudget: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Approval Threshold</label>
            <input
              type="number"
              value={formData.approvalThreshold || 1000}
              onChange={(e) => setFormData({ ...formData, approvalThreshold: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Risk Flag Threshold</label>
            <input
              type="number"
              value={formData.riskFlagThreshold || 5000}
              onChange={(e) => setFormData({ ...formData, riskFlagThreshold: parseFloat(e.target.value) })}
              className="w-full p-2 border rounded"
            />
          </div>
        </div>
        
        <div className="flex items-center space-x-4">
          <label className="flex items-center">
            <input
              type="checkbox"
              checked={formData.autoApprovalEnabled || false}
              onChange={(e) => setFormData({ ...formData, autoApprovalEnabled: e.target.checked })}
              className="mr-2"
            />
            Enable Auto Approval
          </label>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Approval Workflow</label>
          <select
            value={formData.approvalWorkflow || 'single'}
            onChange={(e) => setFormData({ ...formData, approvalWorkflow: e.target.value })}
            className="w-full p-2 border rounded"
          >
            <option value="single">Single Approval</option>
            <option value="dual">Dual Approval</option>
            <option value="committee">Committee Approval</option>
          </select>
        </div>
        
        <button
          type="submit"
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Save Settings
        </button>
      </form>
    </div>
  );
};

// Reports Tab Component
const ReportsTab = ({ reports }) => {
  if (!reports) return <div className="p-6">Loading reports...</div>;

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Monthly Reports</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="bg-blue-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-blue-900">Total Payments</h3>
          <p className="text-2xl font-bold text-blue-600">${reports.totalPayments.toFixed(2)}</p>
          <p className="text-sm text-blue-500">{reports.paymentCount} transactions</p>
        </div>
        
        <div className="bg-green-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-green-900">Total Deposits</h3>
          <p className="text-2xl font-bold text-green-600">${reports.totalDeposits.toFixed(2)}</p>
          <p className="text-sm text-green-500">{reports.depositCount} transactions</p>
        </div>
        
        <div className="bg-yellow-50 p-4 rounded-lg">
          <h3 className="text-lg font-medium text-yellow-900">Total Withdrawals</h3>
          <p className="text-2xl font-bold text-yellow-600">${reports.totalWithdrawals.toFixed(2)}</p>
          <p className="text-sm text-yellow-500">{reports.withdrawalCount} transactions</p>
        </div>
      </div>
      
      <div>
        <h3 className="text-lg font-medium text-gray-900 mb-4">Transaction Details</h3>
        <div className="bg-gray-50 rounded-lg p-4">
          <h4 className="font-medium mb-2">Payments</h4>
          {reports.transactions.payments.map((payment, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <span>Payment #{payment.id}</span>
              <span className="font-medium">${payment.amount.toFixed(2)}</span>
            </div>
          ))}
          
          <h4 className="font-medium mb-2 mt-4">Withdrawals</h4>
          {reports.transactions.withdrawals.map((withdrawal, index) => (
            <div key={index} className="flex justify-between items-center py-1">
              <span>Withdrawal #{withdrawal.id}</span>
              <span className="font-medium">${withdrawal.amount.toFixed(2)}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

// Logs Tab Component
const LogsTab = ({ logs }) => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Audit Logs</h2>
      
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
            {logs.map((log) => (
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
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Treasury; 