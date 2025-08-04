import React, { useState, useEffect } from 'react';
import { Lock, Plus, TrendingUp, Calendar, Clock, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { stakeAPI, dashboardAPI } from '../services/api';

const Stakes = () => {
  const [stakes, setStakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    amount: '',
    lockPeriod: '30'
  });
  const [userBalance, setUserBalance] = useState(0);
  const [stats, setStats] = useState({
    totalStaked: 0,
    totalEarnings: 0,
    activeStakes: 0
  });

  useEffect(() => {
    fetchStakes();
    fetchUserBalance();
    fetchStats();
  }, []);

  const fetchStakes = async () => {
    try {
      const response = await stakeAPI.getStakes();
      setStakes(response.data.stakes || []);
    } catch (error) {
      console.error('Error fetching stakes:', error);
      toast.error('Failed to fetch stakes');
    } finally {
      setLoading(false);
    }
  };

  const fetchUserBalance = async () => {
    try {
      const response = await dashboardAPI.getDashboard();
      setUserBalance(response.data.usdeBalance || 0);
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await stakeAPI.getStats();
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const handleCreateStake = async (e) => {
    e.preventDefault();
    
    if (!formData.amount || parseFloat(formData.amount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (parseFloat(formData.amount) > userBalance) {
      toast.error('Insufficient USDE balance');
      return;
    }

    try {
      setLoading(true);
      await stakeAPI.createStake({
        amount: parseFloat(formData.amount),
        lockPeriod: parseInt(formData.lockPeriod)
      });
      
      toast.success('Stake created successfully!');
      setShowCreateForm(false);
      setFormData({ amount: '', lockPeriod: '30' });
      fetchStakes();
      fetchUserBalance();
      fetchStats();
    } catch (error) {
      console.error('Error creating stake:', error);
      toast.error(error.response?.data?.error || 'Failed to create stake');
    } finally {
      setLoading(false);
    }
  };

  const getInterestRate = (lockPeriod) => {
    const rates = { 30: 4, 90: 4, 180: 4 };
    return rates[lockPeriod] || 4;
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2
    }).format(amount);
  };

  const getStatusIcon = (stake) => {
    if (stake.unlocked) {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    if (stake.isExpired) {
      return <XCircle className="w-5 h-5 text-red-500" />;
    }
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  const getStatusText = (stake) => {
    if (stake.unlocked) return 'Unlocked';
    if (stake.isExpired) return 'Expired';
    return 'Active';
  };

  const getStatusColor = (stake) => {
    if (stake.unlocked) return 'text-green-600 bg-green-100';
    if (stake.isExpired) return 'text-red-600 bg-red-100';
    return 'text-blue-600 bg-blue-100';
  };

  if (loading && stakes.length === 0) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-secondary-dark/70">Loading stakes...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-secondary-dark mb-2">Stakes</h1>
          <p className="text-secondary-dark/70">Lock USDE and earn 4% APY interest</p>
        </div>
        <button
          onClick={() => setShowCreateForm(true)}
          className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="w-4 h-4" />
          Create Stake
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-dark/70">Total Staked</p>
              <p className="text-xl font-bold text-secondary-dark">{formatCurrency(stats.totalStaked)}</p>
            </div>
            <Lock className="w-8 h-8 text-primary" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-dark/70">Total Earnings</p>
              <p className="text-xl font-bold text-green-600">{formatCurrency(stats.totalEarnings)}</p>
            </div>
            <TrendingUp className="w-8 h-8 text-green-500" />
          </div>
        </div>
        <div className="bg-white rounded-lg p-4 shadow-sm border">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-secondary-dark/70">Active Stakes</p>
              <p className="text-xl font-bold text-secondary-dark">{stats.activeStakes}</p>
            </div>
            <Calendar className="w-8 h-8 text-blue-500" />
          </div>
        </div>
      </div>

      {/* Create Stake Form */}
      {showCreateForm && (
        <div className="bg-white rounded-lg p-6 shadow-sm border mb-6">
          <h3 className="text-lg font-semibold text-secondary-dark mb-4">Create New Stake</h3>
          <form onSubmit={handleCreateStake} className="space-y-4">
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
                Lock Period
              </label>
              <select
                value={formData.lockPeriod}
                onChange={(e) => setFormData({ ...formData, lockPeriod: e.target.value })}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="30">30 days (4% APY)</option>
                <option value="90">90 days (4% APY)</option>
                <option value="180">180 days (4% APY)</option>
              </select>
            </div>
            <div className="bg-blue-50 p-4 rounded-lg">
              <p className="text-sm text-blue-800">
                <strong>Interest Rate:</strong> {getInterestRate(formData.lockPeriod)}% APY
              </p>
              <p className="text-sm text-blue-800">
                <strong>Estimated Earnings:</strong> {formData.amount ? formatCurrency(parseFloat(formData.amount) * (getInterestRate(formData.lockPeriod) / 100) * (parseInt(formData.lockPeriod) / 365)) : '$0.00'}
              </p>
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={loading}
                className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-colors disabled:opacity-50"
              >
                {loading ? 'Creating...' : 'Create Stake'}
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
        </div>
      )}

      {/* Stakes List */}
      <div className="bg-white rounded-lg shadow-sm border">
        <div className="p-6 border-b">
          <h3 className="text-lg font-semibold text-secondary-dark">Your Stakes</h3>
        </div>
        {stakes.length === 0 ? (
          <div className="p-8 text-center">
            <Lock className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-secondary-dark mb-2">No stakes yet</h3>
            <p className="text-secondary-dark/70 mb-4">Create your first stake to start earning interest</p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto"
            >
              <Plus className="w-4 h-4" />
              Create First Stake
            </button>
          </div>
        ) : (
          <div className="divide-y">
            {stakes.map((stake) => (
              <div key={stake.id} className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getStatusIcon(stake)}
                    <div>
                      <h4 className="font-medium text-secondary-dark">
                        {formatCurrency(stake.amount)} USDE
                      </h4>
                      <p className="text-sm text-secondary-dark/70">
                        {stake.lockPeriod} days • {getInterestRate(stake.lockPeriod)}% APY
                      </p>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(stake)}`}>
                    {getStatusText(stake)}
                  </span>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-secondary-dark/70">Start Date</p>
                    <p className="font-medium">{formatDate(stake.startDate)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-dark/70">End Date</p>
                    <p className="font-medium">{formatDate(stake.endDate)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-dark/70">Current Earnings</p>
                    <p className="font-medium text-green-600">{formatCurrency(stake.currentEarnings)}</p>
                  </div>
                  <div>
                    <p className="text-secondary-dark/70">Days Held</p>
                    <p className="font-medium">{stake.daysHeld} days</p>
                  </div>
                </div>

                {!stake.unlocked && !stake.isExpired && (
                  <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-blue-800">
                      <strong>Remaining Days:</strong> {stake.remainingDays} days
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

export default Stakes; 