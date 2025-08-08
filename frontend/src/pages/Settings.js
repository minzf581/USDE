import React, { useState, useEffect } from 'react';
import { 
  Settings as SettingsIcon, 
  Lock, 
  Globe, 
  Coins, 
  Server, 
  Save,
  Eye,
  EyeOff
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { settingsAPI } from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('password');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Password change form
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
    showCurrentPassword: false,
    showNewPassword: false,
    showConfirmPassword: false
  });

  // Blockchain settings form
  const [blockchainForm, setBlockchainForm] = useState({
    currentChain: 'polygon_testnet',
    defaultWalletAddress: '',
    contractAddress: ''
  });

  // Token economy settings form
  const [tokenForm, setTokenForm] = useState({
    redemptionPeriod: 30,
    acceptanceRate: 0.95,
    stakingDays: [30, 90, 180]
  });

  // System settings form
  const [systemForm, setSystemForm] = useState({
    useMockChain: true,
    maintenanceMode: false,
    defaultLanguage: 'en',
    defaultTimezone: 'UTC'
  });

  const tabs = [
    { id: 'password', name: 'Password', icon: Lock },
    { id: 'blockchain', name: 'Blockchain Settings', icon: Globe },
    { id: 'token', name: 'Token Economy', icon: Coins },
    { id: 'system', name: 'System Parameters', icon: Server }
  ];

  // Load settings on component mount
  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const response = await settingsAPI.getSettings();
      const { settings } = response.data;
      
      if (settings.blockchain) {
        setBlockchainForm(settings.blockchain);
      }
      if (settings.tokenEconomy) {
        setTokenForm(settings.tokenEconomy);
      }
      if (settings.system) {
        setSystemForm(settings.system);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
      // Don't show error for initial load, just use defaults
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError('New passwords do not match');
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword.length < 8) {
      setError('New password must be at least 8 characters long');
      setLoading(false);
      return;
    }

    try {
      await settingsAPI.changePassword({
        currentPassword: passwordForm.currentPassword,
        newPassword: passwordForm.newPassword
      });
      
      setSuccess('Password updated successfully');
      setPasswordForm({
        currentPassword: '',
        newPassword: '',
        confirmPassword: '',
        showCurrentPassword: false,
        showNewPassword: false,
        showConfirmPassword: false
      });
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  const handleBlockchainSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await settingsAPI.updateBlockchainSettings(blockchainForm);
      setSuccess('Blockchain settings saved successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save blockchain settings');
    } finally {
      setLoading(false);
    }
  };

  const handleTokenSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await settingsAPI.updateTokenEconomySettings(tokenForm);
      setSuccess('Token economy settings saved successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save token economy settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSystemSave = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      await settingsAPI.updateSystemSettings(systemForm);
      setSuccess('System settings saved successfully');
    } catch (error) {
      setError(error.response?.data?.error || 'Failed to save system settings');
    } finally {
      setLoading(false);
    }
  };

  const togglePasswordVisibility = (field) => {
    setPasswordForm(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <SettingsIcon className="w-8 h-8 text-primary mr-3" />
          <h1 className="text-3xl font-bold text-secondary-dark">System Settings</h1>
        </div>
        <p className="text-secondary-dark/70">
          Configure system parameters, blockchain settings, and token economy rules
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="mb-6">
        <nav className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                <Icon className="w-4 h-4 mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {error && (
        <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-md">
          <p className="text-green-600">{success}</p>
        </div>
      )}

      {/* Password Change Tab */}
      {activeTab === 'password' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">Change Administrator Password</h3>
            <p className="text-sm text-gray-600 mt-1">
              Update your administrator password to maintain account security
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={passwordForm.showCurrentPassword ? 'text' : 'password'}
                    value={passwordForm.currentPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, currentPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('showCurrentPassword')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {passwordForm.showCurrentPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={passwordForm.showNewPassword ? 'text' : 'password'}
                    value={passwordForm.newPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, newPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('showNewPassword')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {passwordForm.showNewPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <div className="relative">
                  <input
                    type={passwordForm.showConfirmPassword ? 'text' : 'password'}
                    value={passwordForm.confirmPassword}
                    onChange={(e) => setPasswordForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => togglePasswordVisibility('showConfirmPassword')}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {passwordForm.showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Updating...' : 'Update Password'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Blockchain Settings Tab */}
      {activeTab === 'blockchain' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">🌐 Blockchain Settings</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure chain-related parameters for blockchain operations
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleBlockchainSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Chain
                </label>
                <select
                  value={blockchainForm.currentChain}
                  onChange={(e) => setBlockchainForm(prev => ({ ...prev, currentChain: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="polygon_testnet">Polygon Testnet</option>
                  <option value="polygon_mainnet">Polygon Mainnet</option>
                  <option value="ethereum_testnet">Ethereum Testnet</option>
                  <option value="ethereum_mainnet">Ethereum Mainnet</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Wallet Address
                </label>
                <input
                  type="text"
                  value={blockchainForm.defaultWalletAddress}
                  onChange={(e) => setBlockchainForm(prev => ({ ...prev, defaultWalletAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Contract Address
                </label>
                <input
                  type="text"
                  value={blockchainForm.contractAddress}
                  onChange={(e) => setBlockchainForm(prev => ({ ...prev, contractAddress: e.target.value }))}
                  placeholder="0x..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Blockchain Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Token Economy Settings Tab */}
      {activeTab === 'token' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">🪙 Token Economy Parameters</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure stablecoin economic rules and redemption parameters
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleTokenSave} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Token Redemption Period (days)
                </label>
                <input
                  type="number"
                  value={tokenForm.redemptionPeriod}
                  onChange={(e) => setTokenForm(prev => ({ ...prev, redemptionPeriod: parseInt(e.target.value) }))}
                  min="1"
                  max="365"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Acceptance Rate (%)
                </label>
                <input
                  type="number"
                  value={tokenForm.acceptanceRate * 100}
                  onChange={(e) => setTokenForm(prev => ({ ...prev, acceptanceRate: parseFloat(e.target.value) / 100 }))}
                  min="0"
                  max="100"
                  step="0.1"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Staking Days Options
                </label>
                <div className="space-y-2">
                  {tokenForm.stakingDays.map((days, index) => (
                    <div key={index} className="flex items-center space-x-2">
                      <input
                        type="number"
                        value={days}
                        onChange={(e) => {
                          const newStakingDays = [...tokenForm.stakingDays];
                          newStakingDays[index] = parseInt(e.target.value);
                          setTokenForm(prev => ({ ...prev, stakingDays: newStakingDays }));
                        }}
                        min="1"
                        className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                      />
                      <span className="text-sm text-gray-600">days</span>
                      {tokenForm.stakingDays.length > 1 && (
                        <button
                          type="button"
                          onClick={() => {
                            const newStakingDays = tokenForm.stakingDays.filter((_, i) => i !== index);
                            setTokenForm(prev => ({ ...prev, stakingDays: newStakingDays }));
                          }}
                          className="text-red-500 hover:text-red-700"
                        >
                          Remove
                        </button>
                      )}
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => setTokenForm(prev => ({ ...prev, stakingDays: [...prev.stakingDays, 365] }))}
                    className="text-primary hover:text-primary-dark text-sm"
                  >
                    + Add Staking Option
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save Token Economy Settings'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* System Parameters Tab */}
      {activeTab === 'system' && (
        <div className="bg-white rounded-lg shadow-md">
          <div className="p-6 border-b border-gray-200">
            <h3 className="text-lg font-semibold">⚙️ System Parameters</h3>
            <p className="text-sm text-gray-600 mt-1">
              Configure advanced system settings and maintenance options
            </p>
          </div>
          <div className="p-6">
            <form onSubmit={handleSystemSave} className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Use Mock Chain
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable mock blockchain for testing purposes
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemForm.useMockChain}
                    onChange={(e) => setSystemForm(prev => ({ ...prev, useMockChain: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Maintenance Mode
                  </label>
                  <p className="text-xs text-gray-500">
                    Enable system maintenance mode
                  </p>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    checked={systemForm.maintenanceMode}
                    onChange={(e) => setSystemForm(prev => ({ ...prev, maintenanceMode: e.target.checked }))}
                    className="sr-only peer"
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Language
                </label>
                <select
                  value={systemForm.defaultLanguage}
                  onChange={(e) => setSystemForm(prev => ({ ...prev, defaultLanguage: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="en">English</option>
                  <option value="zh">中文</option>
                  <option value="es">Español</option>
                  <option value="fr">Français</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Default Timezone
                </label>
                <select
                  value={systemForm.defaultTimezone}
                  onChange={(e) => setSystemForm(prev => ({ ...prev, defaultTimezone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                >
                  <option value="UTC">UTC</option>
                  <option value="America/New_York">Eastern Time</option>
                  <option value="America/Chicago">Central Time</option>
                  <option value="America/Denver">Mountain Time</option>
                  <option value="America/Los_Angeles">Pacific Time</option>
                  <option value="Asia/Shanghai">China Standard Time</option>
                  <option value="Asia/Tokyo">Japan Standard Time</option>
                  <option value="Europe/London">GMT</option>
                  <option value="Europe/Paris">Central European Time</option>
                </select>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-md hover:bg-primary-dark disabled:opacity-50"
              >
                <Save className="w-4 h-4 mr-2" />
                {loading ? 'Saving...' : 'Save System Settings'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings; 