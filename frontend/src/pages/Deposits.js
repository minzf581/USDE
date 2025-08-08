import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { ArrowDownLeft, ArrowUpRight, Wallet, CreditCard, History, AlertCircle, Clock, CheckCircle, XCircle } from 'lucide-react';
import { useForm } from 'react-hook-form';
import toast from 'react-hot-toast';
import { depositAPI } from '../services/api';

const Deposits = () => {
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [usdeData, setUsdeData] = useState(null);
  const [stats, setStats] = useState(null);
  const [activeTab, setActiveTab] = useState('deposit');
  const [orderStatus, setOrderStatus] = useState(null); // 新增订单状态跟踪
  const [paymentMethod, setPaymentMethod] = useState('card'); // 新增支付方式选择

  const { register, handleSubmit, reset, formState: { errors } } = useForm();

  // Check for success/cancel from Stripe
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    const orderId = searchParams.get('order_id');
    
    if (success) {
      toast.success('Payment successful! USDE tokens have been minted.');
    } else if (canceled) {
      toast.error('Payment was canceled.');
    }
    
    // 检查URL参数中是否有订单ID
    if (orderId) {
      checkOrderStatus(orderId);
    }
  }, [searchParams]);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const [usdeResponse, statsResponse] = await Promise.all([
        depositAPI.getUSDEBalance(),
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

  // 新增：实时订单状态检查
  const checkOrderStatus = async (orderId) => {
    try {
      const response = await depositAPI.getOrderStatus(orderId);
      setOrderStatus(response.data.data);
      
      // 如果订单完成，刷新余额
      if (response.data.data.status === 'COMPLETED') {
        loadData();
      }
    } catch (error) {
      console.error('Failed to check order status:', error);
    }
  };

  const handleDeposit = async (data) => {
    try {
      setLoading(true);
      
      // 检查KYC状态
      if (usdeData?.kycStatus !== 'approved') {
        toast.error('Please complete KYC verification before depositing.');
        return;
      }
      
      const amount = parseFloat(data.amount);
      if (!amount || amount < 1) {
        toast.error('Please enter a valid amount (minimum $1)');
        return;
      }
      
      // 检查限额
      if (usdeData?.limits?.daily?.remaining && amount > usdeData.limits.daily.remaining) {
        toast.error(`Amount exceeds daily limit. Remaining: $${usdeData.limits.daily.remaining.toFixed(2)}`);
        return;
      }

      const response = await depositAPI.createStripeSession({
        amount,
        paymentMethod
      });
      
      // 显示风控信息（如果需要）
      if (response.data.data.riskAssessment?.requiresReview) {
        toast('Your deposit requires manual review due to risk assessment. You will be notified once approved.', {
          icon: '⚠️',
          duration: 5000
        });
      }

      // 重定向到Stripe
      window.location.href = response.data.data.url;
      
      // 开始跟踪订单状态
      const orderId = response.data.data.orderId;
      const statusInterval = setInterval(() => {
        checkOrderStatus(orderId);
      }, 5000); // 每5秒检查一次

      // 5分钟后停止检查
      setTimeout(() => {
        clearInterval(statusInterval);
      }, 300000);

    } catch (error) {
      console.error('Deposit error:', error);
      if (error.response?.data?.error?.includes('KYC')) {
        toast.error('Please complete KYC verification first');
      } else if (error.response?.data?.error?.includes('risk assessment')) {
        toast.error('Transaction rejected due to risk assessment');
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

  // 新增：订单状态显示组件
  const OrderStatusDisplay = ({ orderStatus }) => {
    if (!orderStatus) return null;

    const getStatusColor = (status) => {
      switch (status) {
        case 'COMPLETED': return 'text-green-600';
        case 'FAILED': return 'text-red-600';
        case 'PROCESSING': return 'text-yellow-600';
        default: return 'text-gray-600';
      }
    };

    const getStatusIcon = (status) => {
      switch (status) {
        case 'COMPLETED': return <CheckCircle className="w-5 h-5 text-green-500" />;
        case 'FAILED': return <XCircle className="w-5 h-5 text-red-500" />;
        case 'PROCESSING': return <Clock className="w-5 h-5 text-yellow-500" />;
        default: return <Clock className="w-5 h-5 text-gray-500" />;
      }
    };

    return (
      <div className="bg-white p-4 rounded-lg shadow mb-6 border">
        <h3 className="text-lg font-medium mb-3">Order Status</h3>
        <div className="space-y-2">
          <p><strong>Order ID:</strong> {orderStatus.orderId}</p>
          <p><strong>Amount:</strong> ${orderStatus.amount}</p>
          <p><strong>USDE Amount:</strong> {orderStatus.usdeAmount}</p>
          <p className={`font-medium ${getStatusColor(orderStatus.status)}`}>
            <strong>Status:</strong> {orderStatus.status}
          </p>
          
          {orderStatus.progress && (
            <div className="mt-4">
              <h4 className="font-medium mb-2">Progress:</h4>
              {orderStatus.progress.map((step, index) => (
                <div key={index} className="flex items-center space-x-2 text-sm">
                  <span className={`w-3 h-3 rounded-full ${
                    step.status === 'completed' ? 'bg-green-500' :
                    step.status === 'failed' ? 'bg-red-500' :
                    'bg-yellow-500'
                  }`}></span>
                  <span>{step.description}</span>
                  <span className="text-gray-500">
                    {new Date(step.timestamp).toLocaleString()}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
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
              <p className="text-3xl font-bold">{formatCurrency(usdeData.data?.balance?.available || usdeData.balance)}</p>
              <p className="text-primary-light mt-2">
                {usdeData.data?.kycStatus === 'approved' || usdeData.kycStatus === 'approved' ? 'Ready to trade' : 'Complete KYC to start trading'}
              </p>
            </div>
            <Wallet className="w-16 h-16 text-primary-light" />
          </div>
        </div>
      )}

      {/* 余额和统计卡片 */}
      {usdeData?.data?.limits && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">USDE Balance</h3>
            <p className="text-3xl font-bold text-blue-600">{formatCurrency(usdeData.data.balance.available)}</p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Daily Limit</h3>
            <p className="text-lg font-semibold">
              ${usdeData.data.limits.daily.remaining.toFixed(2)} remaining
            </p>
            <p className="text-sm text-gray-500">
              of ${usdeData.data.limits.daily.limit.toFixed(2)} daily limit
            </p>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow">
            <h3 className="text-lg font-medium text-gray-900">Monthly Limit</h3>
            <p className="text-lg font-semibold">
              ${usdeData.data.limits.monthly.remaining.toFixed(2)} remaining
            </p>
            <p className="text-sm text-gray-500">
              of ${usdeData.data.limits.monthly.limit.toFixed(2)} monthly limit
            </p>
          </div>
        </div>
      )}

      {/* 订单状态显示 */}
      <OrderStatusDisplay orderStatus={orderStatus} />

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
          <h3 className="text-xl font-semibold mb-4">Deposit USD to Mint USDE</h3>
          <form onSubmit={handleSubmit(handleDeposit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount (USD)
              </label>
              <input
                type="number"
                step="0.01"
                min="1"
                max="1000000"
                {...register('amount', { 
                  required: 'Amount is required',
                  min: { value: 1, message: 'Minimum amount is $1' },
                  max: { value: 1000000, message: 'Maximum amount is $1,000,000' }
                })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                placeholder="Enter amount"
                disabled={usdeData?.data?.kycStatus !== 'approved' && usdeData?.kycStatus !== 'approved'}
                required
              />
              {errors.amount && (
                <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
              )}
              <p className="text-xs text-gray-500 mt-1">
                Fee: 0.25% • You'll receive approximately {
                  (parseFloat(register('amount').value || 0) * 0.9975).toFixed(2) || '0.00'
                } USDE
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Payment Method
              </label>
              <select
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                disabled={loading}
              >
                <option value="card">Credit/Debit Card</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="ach">ACH Transfer</option>
              </select>
            </div>

            <button
              type="submit"
              disabled={loading || (usdeData?.data?.kycStatus !== 'approved' && usdeData?.kycStatus !== 'approved') || !register('amount').value}
              className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? 'Processing...' : 'Deposit & Mint USDE'}
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