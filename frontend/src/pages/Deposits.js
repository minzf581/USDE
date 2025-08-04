import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, History, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { depositAPI } from '../services/api';

const Deposits = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [usdeData, setUsdeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('deposit');

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Check for success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success) {
      toast.success('Payment successful! USDE tokens have been minted.');
    } else if (canceled) {
      toast.error('Payment was canceled.');
    }
  }, [searchParams]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usdeResponse, depositsResponse, withdrawalsResponse, statsResponse] = await Promise.all([
        depositAPI.getUSDEBalance(),
        depositAPI.getHistory(),
        depositAPI.getWithdrawalHistory(),
        depositAPI.getStats()
      ]);

      setUsdeData(usdeResponse.data);
      setStats(statsResponse.data.summary);
    } catch (error) {
      console.error('Error loading data:', error);
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleDeposit = async (data) => {
    try {
      setLoading(true);
      const response = await depositAPI.createStripeSession(data.amount);
      
      // Redirect to Stripe checkout
      window.location.href = response.data.url;
    } catch (error) {
      console.error('Deposit error:', error);
      if (error.response?.data?.error?.includes('KYC')) {
        toast.error('Please complete KYC verification first');
      } else {
        toast.error('Failed to create payment session');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleWithdraw = async (data) => {
    try {
      setLoading(true);
      await depositAPI.withdrawUSDE({
        amount: parseFloat(data.amount),
        walletAddress: data.walletAddress
      });
      
      toast.success('Withdrawal processed successfully');
      reset();
      loadData(); // Reload data to update balance
    } catch (error) {
      console.error('Withdrawal error:', error);
      if (error.response?.data?.error?.includes('Insufficient')) {
        toast.error('Insufficient USDE balance');
      } else if (error.response?.data?.error?.includes('KYC')) {
        toast.error('Please complete KYC verification first');
      } else {
        toast.error('Withdrawal failed');
      }
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
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



  if (loading && !usdeData) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <ArrowDownLeft className="w-8 h-8 text-primary" />
          <h1 className="text-3xl font-bold text-secondary-dark">Deposits & USDE</h1>
        </div>
        <p className="text-secondary-dark/70">Deposit funds and mint USDE stablecoins</p>
      </div>

      {/* USDE Balance Card */}
      {usdeData && (
        <div className="bg-gradient-to-r from-primary to-primary-dark text-white rounded-lg p-6 mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">USDE Balance</h2>
              <p className="text-3xl font-bold">{formatCurrency(usdeData.balance)}</p>
              <p className="text-primary-light mt-2">
                {usdeData.kycStatus === 'approved' ? 'Ready to trade' : 'Complete KYC to start trading'}
              </p>
            </div>
            <Wallet className="w-16 h-16 text-primary-light" />
          </div>
        </div>
      )}

      {/* KYC Warning */}
      {usdeData && usdeData.kycStatus !== 'approved' && (
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-yellow-600" />
            <div>
              <h3 className="font-semibold text-yellow-800">KYC Required</h3>
              <p className="text-yellow-700">Please complete KYC verification to deposit and withdraw funds.</p>
            </div>
          </div>
        </div>
      )}

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 mb-6">
        <button
          onClick={() => setActiveTab('deposit')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'deposit' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <CreditCard className="w-4 h-4 inline mr-2" />
          Deposit
        </button>
        <button
          onClick={() => setActiveTab('withdraw')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'withdraw' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <ArrowUpRight className="w-4 h-4 inline mr-2" />
          Withdraw
        </button>
        <button
          onClick={() => setActiveTab('history')}
          className={`flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
            activeTab === 'history' 
              ? 'bg-white text-primary shadow-sm' 
              : 'text-gray-600 hover:text-gray-800'
          }`}
        >
          <History className="w-4 h-4 inline mr-2" />
          History
        </button>
      </div>

      {/* Deposit Tab */}
      {activeTab === 'deposit' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">Deposit Funds</h3>
          <form onSubmit={handleSubmit(handleDeposit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 1, message: 'Minimum amount is $1' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter amount to deposit"
                disabled={usdeData?.kycStatus !== 'approved'}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || usdeData?.kycStatus !== 'approved'}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Deposit and Mint USDE'}
            </button>
          </form>
        </div>
      )}

      {/* Withdraw Tab */}
      {activeTab === 'withdraw' && (
        <div className="bg-white rounded-lg shadow-sm border p-6">
          <h3 className="text-xl font-semibold mb-4">Withdraw USDE</h3>
          <form onSubmit={handleSubmit(handleWithdraw)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USDE)
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 0.01, message: 'Minimum amount is 0.01 USDE' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter amount to withdraw"
                disabled={usdeData?.kycStatus !== 'approved'}
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Wallet Address
              </label>
              <input
                type="text"
                {...register('walletAddress', { 
                  required: 'Wallet address is required',
                  minLength: { value: 26, message: 'Invalid wallet address' },
                  maxLength: { value: 42, message: 'Invalid wallet address' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter your wallet address"
                disabled={usdeData?.kycStatus !== 'approved'}
              />
              {errors.walletAddress && (
                <p className="text-red-500 text-sm mt-1">{errors.walletAddress.message}</p>
              )}
            </div>
            <button
              type="submit"
              disabled={loading || usdeData?.kycStatus !== 'approved'}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Withdraw to Wallet'}
            </button>
          </form>
        </div>
      )}

      {/* History Tab */}
      {activeTab === 'history' && (
        <div className="space-y-6">
          {/* Transaction History */}
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <h3 className="text-xl font-semibold mb-4">Transaction History</h3>
            {usdeData?.transactions?.length > 0 ? (
              <div className="space-y-3">
                {usdeData.transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      {transaction.type === 'mint' ? (
                        <ArrowDownLeft className="w-5 h-5 text-green-500" />
                      ) : (
                        <ArrowUpRight className="w-5 h-5 text-red-500" />
                      )}
                      <div>
                        <p className="font-medium">{transaction.description}</p>
                        <p className="text-sm text-gray-500">{formatDate(transaction.timestamp)}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${transaction.type === 'mint' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'mint' ? '+' : '-'}{formatCurrency(transaction.amount)}
                      </p>
                      <p className="text-sm text-gray-500">Balance: {formatCurrency(transaction.balanceAfter)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-8">No transactions yet</p>
            )}
          </div>

          {/* Statistics */}
          {stats && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-medium text-gray-500">Total Deposits</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.totalDeposits)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-medium text-gray-500">Pending Deposits</h4>
                <p className="text-2xl font-bold text-yellow-600">{formatCurrency(stats.pendingDeposits)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-medium text-gray-500">Completed Deposits</h4>
                <p className="text-2xl font-bold text-green-600">{formatCurrency(stats.completedDeposits)}</p>
              </div>
              <div className="bg-white rounded-lg shadow-sm border p-4">
                <h4 className="text-sm font-medium text-gray-500">Total Withdrawals</h4>
                <p className="text-2xl font-bold text-red-600">{formatCurrency(stats.totalWithdrawals)}</p>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default Deposits; 