import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../services/api';
import { LoadingSpinner } from '../components/LoadingSpinner';
import { 
  Save, 
  AlertCircle,
  CheckCircle,
  DollarSign,
  Shield,
  Users,
  Mail,
  Building,
  Edit
} from 'lucide-react';
import toast from 'react-hot-toast';

const Settings = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(null);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [activeTab, setActiveTab] = useState('profile');

  // Check if user has enterprise admin permissions
  const isEnterpriseAdmin = user?.role === 'enterprise_admin';

  // Profile form states
  const [profileData, setProfileData] = useState({
    name: '',
    email: ''
  });
  const [editing, setEditing] = useState(false);

  // Enterprise settings form states
  const [enterpriseData, setEnterpriseData] = useState({
    monthlyBudget: 0,
    quarterlyBudget: 0,
    approvalThreshold: 1000,
    autoApprovalEnabled: false,
    riskFlagThreshold: 5000,
    approvalWorkflow: 'single'
  });

  useEffect(() => {
    if (isEnterpriseAdmin) {
      loadData();
    } else {
      setLoading(false);
    }
  }, [isEnterpriseAdmin]);

  useEffect(() => {
    if (user) {
      setProfileData({
        name: user.name || '',
        email: user.email || ''
      });
    }
  }, [user]);

  const loadData = async () => {
    try {
      setLoading(true);
      
      // Load enterprise settings
      const settingsResponse = await api.get('/enterprise/settings');
      const { treasurySettings } = settingsResponse.data;
      
      if (treasurySettings) {
        setEnterpriseData({
          monthlyBudget: treasurySettings.monthlyBudget || 0,
          quarterlyBudget: treasurySettings.quarterlyBudget || 0,
          approvalThreshold: treasurySettings.approvalThreshold || 1000,
          autoApprovalEnabled: treasurySettings.autoApprovalEnabled || false,
          riskFlagThreshold: treasurySettings.riskFlagThreshold || 5000,
          approvalWorkflow: treasurySettings.approvalWorkflow || 'single'
        });
      }
      setSettings(settingsResponse.data);
    } catch (error) {
      console.error('Error loading settings:', error);
      setError('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleProfileChange = (e) => {
    setProfileData({
      ...profileData,
      [e.target.name]: e.target.value
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await api.put('/company/profile', profileData);
      updateUser(response.data.company);
      setEditing(false);
      toast.success('Profile updated successfully');
    } catch (error) {
      const message = error.response?.data?.error || 'Failed to update profile';
      toast.error(message);
    } finally {
      setLoading(false);
    }
  };

  const handleEnterpriseChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEnterpriseData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleEnterpriseSubmit = async (e) => {
    e.preventDefault();
    try {
      setSaving(true);
      setError('');
      setSuccess('');

      await api.put('/enterprise/settings', enterpriseData);
      setSuccess('Settings updated successfully');
      
      // Reload settings to get updated data
      await loadData();
    } catch (error) {
      console.error('Error updating settings:', error);
      setError(error.response?.data?.error || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <LoadingSpinner />;
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Settings</h1>
        <p className="text-gray-600">Manage your profile and enterprise settings</p>
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

      {/* Tab Navigation */}
      <div className="border-b border-gray-200 mb-6">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-blue-500 text-blue-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Profile
          </button>
          {isEnterpriseAdmin && (
            <button
              onClick={() => setActiveTab('enterprise')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${
                activeTab === 'enterprise'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Enterprise Settings
            </button>
          )}
        </nav>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-lg shadow">
        {activeTab === 'profile' && (
          <div className="p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-gray-900">Company Information</h2>
              <button
                onClick={() => setEditing(!editing)}
                className="btn-secondary flex items-center space-x-2"
              >
                {editing ? <Save className="w-4 h-4" /> : <Edit className="w-4 h-4" />}
                <span>{editing ? 'Cancel' : 'Edit'}</span>
              </button>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Company Name
                </label>
                <div className="relative">
                  <Building className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="name"
                    name="name"
                    type="text"
                    value={profileData.name}
                    onChange={handleProfileChange}
                    disabled={!editing}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Enter company name"
                  />
                </div>
              </div>

              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                  Email Address
                </label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={profileData.email}
                    onChange={handleProfileChange}
                    disabled={!editing}
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50"
                    placeholder="Enter email address"
                  />
                </div>
              </div>

              {editing && (
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                >
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                  ) : null}
                  {loading ? 'Saving...' : 'Save Changes'}
                </button>
              )}
            </form>

            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Account Information</h3>
              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className="text-gray-500">Account ID</span>
                  <span className="font-medium text-gray-900">{user?.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Member Since</span>
                  <span className="font-medium text-gray-900">
                    {user?.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'N/A'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">KYC Status</span>
                  <span className={`font-medium capitalize px-2 py-1 rounded-full text-sm ${
                    user?.kycStatus === 'approved' ? 'bg-green-100 text-green-700' :
                    user?.kycStatus === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                    user?.kycStatus === 'rejected' ? 'bg-red-100 text-red-700' :
                    'bg-gray-100 text-gray-700'
                  }`}>
                    {user?.kycStatus || 'Unknown'}
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'enterprise' && isEnterpriseAdmin && (
          <div className="p-6">
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2">Enterprise Settings</h2>
              <p className="text-gray-600">Configure your enterprise financial control settings</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Settings Form */}
              <div className="lg:col-span-2">
                <form onSubmit={handleEnterpriseSubmit} className="space-y-6">
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
                          value={enterpriseData.monthlyBudget}
                          onChange={handleEnterpriseChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          value={enterpriseData.quarterlyBudget}
                          onChange={handleEnterpriseChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          value={enterpriseData.approvalThreshold}
                          onChange={handleEnterpriseChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          value={enterpriseData.riskFlagThreshold}
                          onChange={handleEnterpriseChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                          value={enterpriseData.approvalWorkflow}
                          onChange={handleEnterpriseChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                            checked={enterpriseData.autoApprovalEnabled}
                            onChange={handleEnterpriseChange}
                            className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
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
                      className="flex items-center space-x-2 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50"
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

              {/* Enterprise Info */}
              <div className="lg:col-span-1">
                <div className="bg-gray-50 rounded-lg p-6">
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
                        <span className="font-medium">${enterpriseData.monthlyBudget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Quarterly Budget:</span>
                        <span className="font-medium">${enterpriseData.quarterlyBudget.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Approval Threshold:</span>
                        <span className="font-medium">${enterpriseData.approvalThreshold.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Risk Flag Threshold:</span>
                        <span className="font-medium">${enterpriseData.riskFlagThreshold.toLocaleString()}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Auto-Approval:</span>
                        <span className={`font-medium ${enterpriseData.autoApprovalEnabled ? 'text-green-600' : 'text-red-600'}`}>
                          {enterpriseData.autoApprovalEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Workflow:</span>
                        <span className="font-medium capitalize">{enterpriseData.approvalWorkflow}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings; 