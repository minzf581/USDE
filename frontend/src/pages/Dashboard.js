import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { dashboardAPI } from '../services/api';
import { 
  DollarSign, 
  TrendingUp, 
  Lock, 
  Wallet,
  ArrowUpRight,
  ArrowDownLeft,
  Clock,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { LoadingSpinner } from '../components/LoadingSpinner';

const Dashboard = () => {
  const { user } = useAuth();
  const [dashboardData, setDashboardData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

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
    </div>
  );
};

export default Dashboard; 