import React, { useState, useEffect } from 'react';
import { ArrowUpRight, Plus, Clock, CheckCircle, XCircle, DollarSign, Bank, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import api from '../services/api';

const Withdrawals = () => {
  const [withdrawals, setWithdrawals] = useState([]);
  const [bankAccounts, setBankAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    bankAccountId: ''
  });
  const [userBalance, setUserBalance] = useState(0);
  const [stats, setStats] = useState({
    totalWithdrawn: 0,
    pendingWithdrawals: 0,
    completedWithdrawals: 0
  });

  useEffect(() => {
    fetchWithdrawals();
    fetchBankAccounts();
    fetchUserBalance();
    fetchStats();
  }, []);

  const fetchWithdrawals = async () => {
    try {
      const response = await api.get('/withdrawal');
      setWithdrawals(response.data.withdrawals || []);
    } catch (error) {
      console.error('Error fetching withdrawals:', error);
      toast.error('Failed to fetch withdrawals');
    } finally {
      setLoading(false);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const response = await api.get('/bank-account');
      setBankAccounts(response.data.bankAccounts || []);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await api.get('/dashboard');
      setUserBalance(response.data.usdeBalance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/withdrawal/stats/summary');
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateWithdrawal = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!formData.bankAccountId) {
      toast.error('Please select a bank account');
      return;
    }

    if (parseFloat(formData.amount) > userBalance) {
      toast.error('Insufficient USDE balance');
      return;
    }

    try {
      setLoading(true);
      await api.post('/withdrawal', {
        amount: parseFloat(formData.amount),
        bankAccountId: formData.bankAccountId
      });
      
      toast.success('Withdrawal request created successfully!');
      setShowCreateForm(false);
      setFormData({ amount: '', bankAccountId: '' });
      fetchWithdrawals();
      fetchUserBalance();
      fetchStats();
    } catch (error) {
      console.error('Error creating withdrawal:', error);
      toast.error(error.response?.data?.error || 'Failed to create withdrawal');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusIcon = (withdrawal) => {
    switch (withdrawal.status) {
      case 'pending':
        return <Clock className="w-5 h-5 text-yellow-500" />;
      case 'completed':
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="w-5 h-5 text-red-500" />;
      default:
        return <Clock className="w-5 h-5 text-gray-500" />;
    }
  };

  const getStatusText = (withdrawal) => {
    switch (withdrawal.status) {
      case 'pending':
        return 'Pending Approval';
      case 'completed':
        return 'Completed';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = (withdrawal) => {
    switch (withdrawal.status) {
      case 'pending':
        return 'text-yellow-600 bg-yellow-100';
      case 'completed':
        return 'text-green-600 bg-green-100';
      case 'rejected':
        return 'text-red-600 bg-red-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  if (loading && withdrawals.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-secondary-dark/70">Loading withdrawals...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-dark mb-2">Withdrawals</h1>
          <p className="text-secondary-dark/70">Withdraw USDE and convert back to USD</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          New Withdrawal
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-dark/70">Total Withdrawn</p>
              <p className="text-xl font-bold text-secondary-dark">{formatCurrency(stats.totalWithdrawn)}</p>
            </div>
            <ArrowUpRight className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-dark/70">Pending</p>
              <p className="text-xl font-bold text-yellow-600">{stats.pendingWithdrawals}</p>
            </div>
            <Clock className="w-8 h-8 text-yellow-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-dark/70">Completed</p>
              <p className="text-xl font-bold text-green-600">{stats.completedWithdrawals}</p>
            </div>
            <CheckCircle className="w-8 h-8 text-green-500" />
          </div>
        </div>
      </div>

      {/* Create Withdrawal Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Create Withdrawal Request</h3>
          
          {bankAccounts.length === 0 ? (
            <div className="bg-yellow-50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="w-5 h-5 text-yellow-600" />
                <h4 className="font-medium text-yellow-800">No Bank Account</h4>
              </div>
              <p className="text-yellow-700 text-sm mb-3">
                You need to add a bank account before creating a withdrawal request.
              </p>
              <button
                onClick={() => window.location.href = '/profile'}
                className="bg-yellow-600 hover:bg-yellow-700 text-white px-4 py-2 rounded-lg text-sm"
              >
                Add Bank Account
              </button>
            </div>
          ) : (
            <form onSubmit={handleCreateWithdrawal} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Amount (USDE)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  max={userBalance}
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Enter amount"
                  required
                />
                <p className="text-sm text-secondary-dark/70 mt-1">
                  Available balance: {formatCurrency(userBalance)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-secondary-dark mb-2">
                  Bank Account
                </label>
                <select
                  value={formData.bankAccountId}
                  onChange={(e) => setFormData({ ...formData, bankAccountId: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  required
                >
                  <option value="">Select a bank account</option>
                  {bankAccounts.map((account) => (
                    <option key={account.id} value={account.id}>
                      {account.bankName} - {account.accountNum}
                    </option>
                  ))}
                </select>
              </div>
              <div className="bg-blue-50 p-4 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Withdrawal requests are processed within 1-3 business days.
                </p>
                <p className="text-sm text-blue-800 mt-1">
                  <strong>Fee:</strong> No withdrawal fees for amounts above $100.
                </p>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Withdrawal'}
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="bg-gray-200 hover:bg-gray-300 text-secondary-dark px-4 py-2 rounded-lg transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* Withdrawals List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-secondary-dark">Withdrawal History</h3>
        </div>
        {withdrawals.length === 0 ? (
          <div className="p-8 text-center">
            <ArrowUpRight className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-dark mb-2">No withdrawals yet</h3>
            <p className="text-secondary-dark/70 mb-4">Create your first withdrawal request to convert USDE back to USD</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create First Withdrawal
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {withdrawals.map((withdrawal) => (
              <div key={withdrawal.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(withdrawal)}
                    <div>
                      <h4 className="font-medium text-secondary-dark">
                        {formatCurrency(withdrawal.amount)} USDE
                      </h4>
                      <p className="text-sm text-secondary-dark/70">
                        {withdrawal.bankAccount?.bankName} - {withdrawal.bankAccount?.accountNum}
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(withdrawal)}`}>
                    {getStatusText(withdrawal)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-secondary-dark/70">Request Date</p>
                    <p className="font-medium">{formatDate(withdrawal.timestamp)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-dark/70">Bank Account</p>
                    <p className="font-medium">{withdrawal.bankAccount?.bankName}</p>
                  </div>
                  <div>
                    <p className="text-secondary-dark/70">Transaction Hash</p>
                    <p className="font-medium text-xs font-mono">
                      {withdrawal.burnTxHash ? withdrawal.burnTxHash.substring(0, 8) + '...' : 'Pending'}
                    </p>
                  </div>
                  <div>
                    <p className="text-secondary-dark/70">USD Amount</p>
                    <p className="font-medium">{formatCurrency(withdrawal.amount)}</p>
                  </div>
                </div>

                {withdrawal.status === 'pending' && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-lg">
                    <p className="text-sm text-yellow-800">
                      <strong>Status:</strong> Your withdrawal request is being reviewed by our team.
                    </p>
                  </div>
                )}

                {withdrawal.status === 'rejected' && withdrawal.notes && (
                  <div className="mt-4 p-3 bg-red-50 rounded-lg">
                    <p className="text-sm text-red-800">
                      <strong>Reason:</strong> {withdrawal.notes}
                    </p>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Withdrawals; 