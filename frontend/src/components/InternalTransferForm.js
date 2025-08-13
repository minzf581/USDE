import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import api from '../services/api';

const InternalTransferForm = () => {
  const { user } = useAuth();
  const [subsidiaries, setSubsidiaries] = useState([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    targetCompanyId: '',
    tokenAddress: '0xA0b86a33E6B3F...', // Default USDE token address
    amount: '',
    purpose: ''
  });

  useEffect(() => {
    if (user?.companyId) {
      fetchSubsidiaries();
    }
  }, [user?.companyId]);

  const fetchSubsidiaries = async () => {
    try {
      const response = await api.get(`/api/companies/${user.companyId}/subsidiaries`);
      setSubsidiaries(response.data);
    } catch (error) {
      console.error('Error fetching subsidiaries:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.targetCompanyId || !formData.amount || !formData.purpose) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      setLoading(true);
      await api.post('/api/payments/internal-transfer', formData);
      
      // Reset form
      setFormData({
        targetCompanyId: '',
        tokenAddress: '0xA0b86a33E6B3F...',
        amount: '',
        purpose: ''
      });
      
      alert('Internal transfer request created successfully!');
    } catch (error) {
      console.error('Error creating internal transfer:', error);
      alert('Failed to create transfer request: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  if (subsidiaries.length === 0) {
    return (
      <div className="p-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <p className="text-yellow-800">
            No subsidiaries available for internal transfers. Please contact your administrator to set up subsidiaries.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <div className="max-w-2xl mx-auto">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Internal Transfer Request</h2>
          
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Target Company Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Target Company <span className="text-red-500">*</span>
              </label>
              <select
                name="targetCompanyId"
                value={formData.targetCompanyId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="">Select Target Company</option>
                {subsidiaries.map(company => (
                  <option key={company.id} value={company.id}>
                    {company.name} ({company.companyCode})
                  </option>
                ))}
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the subsidiary company to transfer funds to
              </p>
            </div>

            {/* Token Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Token <span className="text-red-500">*</span>
              </label>
              <select
                name="tokenAddress"
                value={formData.tokenAddress}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                <option value="0xA0b86a33E6B3F...">USDE Stablecoin</option>
                <option value="0xUC...">UC Token</option>
              </select>
              <p className="mt-1 text-sm text-gray-500">
                Select the token to transfer
              </p>
            </div>

            {/* Amount */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Amount <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type="number"
                  name="amount"
                  value={formData.amount}
                  onChange={handleInputChange}
                  step="0.000000000000000001"
                  min="0"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="0.00"
                  required
                />
                <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
                  <span className="text-gray-500 sm:text-sm">
                    {formData.tokenAddress.includes('USDE') ? 'USDE' : 'UC'}
                  </span>
                </div>
              </div>
              <p className="mt-1 text-sm text-gray-500">
                Enter the amount to transfer
              </p>
            </div>

            {/* Purpose */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Purpose <span className="text-red-500">*</span>
              </label>
              <textarea
                name="purpose"
                value={formData.purpose}
                onChange={handleInputChange}
                rows={3}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Describe the purpose of this transfer..."
                required
              />
              <p className="mt-1 text-sm text-gray-500">
                Provide a clear description of why this transfer is needed
              </p>
            </div>

            {/* Transfer Summary */}
            {formData.targetCompanyId && formData.amount && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <h3 className="text-sm font-medium text-blue-900 mb-2">Transfer Summary</h3>
                <div className="text-sm text-blue-800 space-y-1">
                  <p>
                    <span className="font-medium">From:</span> {user?.companyName || 'Your Company'}
                  </p>
                  <p>
                    <span className="font-medium">To:</span> {
                      subsidiaries.find(s => s.id === formData.targetCompanyId)?.name
                    }
                  </p>
                  <p>
                    <span className="font-medium">Amount:</span> {formData.amount} {
                      formData.tokenAddress.includes('USDE') ? 'USDE' : 'UC'
                    }
                  </p>
                  <p>
                    <span className="font-medium">Purpose:</span> {formData.purpose}
                  </p>
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={() => setFormData({
                  targetCompanyId: '',
                  tokenAddress: '0xA0b86a33E6B3F...',
                  amount: '',
                  purpose: ''
                })}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Reset Form
              </button>
              <button
                type="submit"
                disabled={loading || !formData.targetCompanyId || !formData.amount || !formData.purpose}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                {loading ? 'Creating Request...' : 'Create Transfer Request'}
              </button>
            </div>
          </form>

          {/* Important Notes */}
          <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="text-sm font-medium text-yellow-900 mb-2">Important Notes:</h3>
            <ul className="text-sm text-yellow-800 space-y-1">
              <li>• Internal transfers require approval from authorized personnel</li>
              <li>• Transfers can only be made between companies in the same group</li>
              <li>• Ensure sufficient balance before creating transfer requests</li>
              <li>• All transfers are logged and auditable</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InternalTransferForm;

