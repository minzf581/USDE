import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  Settings, 
  Save, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Shield,
  TrendingUp,
  Users
} from 'lucide-react';

const EnterpriseSettings = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Form states
  const [formData, setFormData] = useState({
    monthlyBudget: 0,
    quarterlyBudget: 0,
    approvalThreshold: 1000,
    autoApprovalEnabled: false,
    riskFlagThreshold: 5000,
    approvalWorkflow: 'single'
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/enterprise/settings');
      const { treasurySettings } = response.data;
      
      if (treasurySettings) {
        setFormData({
          monthlyBudget: treasurySettings.monthlyBudget || 0,
          quarterlyBudget: treasurySettings.quarterlyBudget || 0,
          approvalThreshold: treasurySettings.approvalThreshold || 1000,
          autoApprovalEnabled: treasurySettings.autoApprovalEnabled || false,
          riskFlagThreshold: treasurySettings.riskFlagThreshold || 5000,
          approvalWorkflow: treasurySettings.approvalWorkflow || 'single'
        });
      }
      setSettings(response.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.put('/enterprise/settings', formData);
      setSuccess('Settings updated successfully');
      
      // Reload settings to get updated data
      await loadSettings();
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Enterprise Settings</h1>
        <p className="text-gray-600">Configure your enterprise financial control settings</p>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-600 mr-2" />
            <span className="text-red-800">{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg">
          <div className="flex items-center">
            <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
            <span className="text-green-800">{success}</span>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Settings Form */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200">
            <div className="p-6 border-b border-gray-200">
              <div className="flex items-center space-x-2">
                <Settings className="w-5 h-5 text-gray-600" />
                <h2 className="text-lg font-semibold text-gray-900">Financial Control Settings</h2>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              {/* Budget Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <DollarSign className="w-4 h-4 mr-2" />
                  Budget Settings
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Monthly Budget (USD)
                    </label>
                    <input
                      type="number"
                      name="monthlyBudget"
                      value={formData.monthlyBudget}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quarterly Budget (USD)
                    </label>
                    <input
                      type="number"
                      name="quarterlyBudget"
                      value={formData.quarterlyBudget}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
              </div>

              {/* Approval Settings */}
              <div>
                <h3 className="text-md font-medium text-gray-900 mb-4 flex items-center">
                  <Shield className="w-4 h-4 mr-2" />
                  Approval Settings
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approval Threshold (USD)
                    </label>
                    <input
                      type="number"
                      name="approvalThreshold"
                      value={formData.approvalThreshold}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Transactions above this amount require approval
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Risk Flag Threshold (USD)
                    </label>
                    <input
                      type="number"
                      name="riskFlagThreshold"
                      value={formData.riskFlagThreshold}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                      min="0"
                      step="0.01"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Transactions above this amount trigger risk flags
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Approval Workflow
                    </label>
                    <select
                      name="approvalWorkflow"
                      value={formData.approvalWorkflow}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                    >
                      <option value="single">Single Approval</option>
                      <option value="dual">Dual Approval</option>
                      <option value="committee">Committee Approval</option>
                    </select>
                  </div>
                  <div>
                    <label className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        name="autoApprovalEnabled"
                        checked={formData.autoApprovalEnabled}
                        onChange={handleChange}
                        className="rounded border-gray-300 text-primary focus:ring-primary"
                      />
                      <span className="text-sm font-medium text-gray-700">Enable Auto-Approval</span>
                    </label>
                    <p className="text-xs text-gray-500 mt-1">
                      Automatically approve transactions below threshold
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={saving}
                  className="flex items-center space-x-2 px-6 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors disabled:opacity-50"
                >
                  {saving ? (
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  ) : (
                    <Save className="w-4 h-4" />
                  )}
                  <span>{saving ? 'Saving...' : 'Save Settings'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Enterprise Info */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
              <Users className="w-4 h-4 mr-2" />
              Enterprise Information
            </h3>
            
            {settings?.enterprise && (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-500">Enterprise Name</label>
                  <p className="text-sm font-medium text-gray-900">{settings.enterprise.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Admin</label>
                  <p className="text-sm font-medium text-gray-900">{user?.name}</p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-500">Created</label>
                  <p className="text-sm text-gray-600">
                    {new Date(settings.enterprise.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
            )}

            <div className="mt-6 pt-6 border-t border-gray-200">
              <h4 className="text-sm font-medium text-gray-900 mb-3">Current Settings</h4>
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500">Monthly Budget:</span>
                  <span className="font-medium">${formData.monthlyBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Quarterly Budget:</span>
                  <span className="font-medium">${formData.quarterlyBudget.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Approval Threshold:</span>
                  <span className="font-medium">${formData.approvalThreshold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Risk Flag Threshold:</span>
                  <span className="font-medium">${formData.riskFlagThreshold.toLocaleString()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Auto-Approval:</span>
                  <span className={`font-medium ${formData.autoApprovalEnabled ? 'text-green-600' : 'text-red-600'}`}>
                    {formData.autoApprovalEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Workflow:</span>
                  <span className="font-medium capitalize">{formData.approvalWorkflow}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EnterpriseSettings; 