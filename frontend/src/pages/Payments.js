import React, { useState, useEffect } from 'react';
import { CreditCard, Send, Clock, CheckCircle, AlertCircle, DollarSign } from 'lucide-react';
import { paymentAPI } from '../services/api';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [lockedBalances, setLockedBalances] = useState([]);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [formData, setFormData] = useState({
    toEmail: '',
    amount: '',
    lockDays: 30
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchPayments();
    fetchLockedBalances();
  }, []);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await paymentAPI.getHistory();
      setPayments(response.data.payments);
    } catch (error) {
      console.error('Error fetching payments:', error);
      setError('Failed to load payment history');
    } finally {
      setLoading(false);
    }
  };

  const fetchLockedBalances = async () => {
    try {
      const response = await paymentAPI.getLockedBalances();
      setLockedBalances(response.data.lockedBalances);
    } catch (error) {
      console.error('Error fetching locked balances:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSending(true);
    setError('');
    setSuccess('');

    try {
      await paymentAPI.sendPayment(formData);
      setSuccess('Payment sent successfully!');
      setFormData({ toEmail: '', amount: '', lockDays: 30 });
      fetchPayments();
      fetchLockedBalances();
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to send payment');
    } finally {
      setSending(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
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

  const getStatusIcon = (status, releaseAt) => {
    if (status === 'released') {
      return <CheckCircle className="w-5 h-5 text-green-500" />;
    }
    
    const now = new Date();
    const releaseDate = new Date(releaseAt);
    if (releaseDate <= now) {
      return <AlertCircle className="w-5 h-5 text-yellow-500" />;
    }
    
    return <Clock className="w-5 h-5 text-blue-500" />;
  };

  const getStatusText = (status, releaseAt) => {
    if (status === 'released') {
      return 'Released';
    }
    
    const now = new Date();
    const releaseDate = new Date(releaseAt);
    if (releaseDate <= now) {
      return 'Ready to Release';
    }
    
    const daysRemaining = Math.ceil((releaseDate - now) / (1000 * 60 * 60 * 24));
    return `Locked (${daysRemaining} days remaining)`;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <CreditCard className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-secondary-dark">Payments</h1>
        </div>
        <p className="text-secondary-dark/70">
          Send USDE payments to suppliers with lock-in periods
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Send Payment Form */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <Send className="w-5 h-5 mr-2" />
              Send Payment
            </h2>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Recipient Email
                </label>
                <input
                  type="email"
                  name="toEmail"
                  value={formData.toEmail}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="supplier@company.com"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount (USDE)
                </label>
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                  placeholder="1000.00"
                  step="0.01"
                  min="0.01"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Lock Period
                </label>
                <select
                  name="lockDays"
                  value={formData.lockDays}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary"
                >
                  <option value={30}>30 days</option>
                  <option value={90}>90 days</option>
                  <option value={180}>180 days</option>
                </select>
              </div>

              {error && (
                <div className="text-red-600 text-sm bg-red-50 p-3 rounded-md">
                  {error}
                </div>
              )}

              {success && (
                <div className="text-green-600 text-sm bg-green-50 p-3 rounded-md">
                  {success}
                </div>
              )}

              <button
                type="submit"
                disabled={sending}
                className="w-full bg-primary text-white py-2 px-4 rounded-md hover:bg-primary-dark disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
              >
                {sending ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Sending...
                  </>
                ) : (
                  <>
                    <Send className="w-4 h-4 mr-2" />
                    Send Payment
                  </>
                )}
              </button>
            </form>
          </div>

          {/* Locked Balances */}
          <div className="bg-white rounded-lg shadow-md p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center">
              <Clock className="w-5 h-5 mr-2" />
              Locked Balances
            </h3>
            
            {lockedBalances.length === 0 ? (
              <p className="text-gray-500 text-sm">No locked balances</p>
            ) : (
              <div className="space-y-3">
                {lockedBalances.map((lock) => (
                  <div key={lock.id} className="border-l-4 border-blue-500 pl-3">
                    <div className="flex justify-between items-center">
                      <span className="font-medium">
                        {lock.amount.toLocaleString()} USDE
                      </span>
                      <span className="text-sm text-gray-500">
                        {lock.daysRemaining > 0 ? `${lock.daysRemaining} days` : 'Ready'}
                      </span>
                    </div>
                    <p className="text-xs text-gray-400">
                      Release: {formatDate(lock.releaseAt)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Payment History */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4 flex items-center">
              <DollarSign className="w-5 h-5 mr-2" />
              Payment History
            </h2>
            
            {loading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              </div>
            ) : payments.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No payment history</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Type</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Lock Period</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              payment.type === 'sent' 
                                ? 'bg-red-100 text-red-800' 
                                : 'bg-green-100 text-green-800'
                            }`}>
                              {payment.type === 'sent' ? 'Sent' : 'Received'}
                            </span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">
                            {payment.counterparty.email}
                          </p>
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {payment.amount.toLocaleString()} USDE
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {payment.lockDays} days
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center">
                            {getStatusIcon(payment.status, payment.releaseAt)}
                            <span className="ml-2 text-sm">
                              {getStatusText(payment.status, payment.releaseAt)}
                            </span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-600">
                          {formatDate(payment.timestamp)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Payments; 