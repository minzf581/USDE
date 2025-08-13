import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001/api';

export const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// API endpoints
export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  getProfile: () => api.get('/auth/profile'),
};

export const companyAPI = {
  // 基础公司信息
  updateProfile: (data) => api.put('/company/profile', data),
  uploadKYC: (formData) => api.post('/company/kyc/upload', formData),
  getKYCStatus: () => api.get('/company/kyc/status'),
  updateKYCStatus: (companyId, status) => api.put(`/company/kyc/status/${companyId}`, { status }),
  
  // 多公司架构支持
  getCurrentCompany: () => api.get('/company/current'),
  getSubsidiaries: (parentId) => api.get(`/company/${parentId}/subsidiaries`),
  registerSubsidiary: (data) => api.post('/company/subsidiary', data),
  updateSubsidiary: (companyId, data) => api.put(`/company/${companyId}`, data),
  deleteSubsidiary: (companyId) => api.delete(`/company/${companyId}`),
  getConsolidatedBalance: (parentId, token) => 
    api.get(`/company/${parentId}/consolidated-balance?token=${token}`),
  configureSubsidiary: (companyId, config) => 
    api.patch(`/company/${companyId}/config`, config),
  
  // 内部转账
  internalTransfer: (data) => api.post('/payment/internal-transfer', data),
  getInternalTransfers: (companyId) => api.get(`/payment/internal-transfers?companyId=${companyId}`),
  
  // 公司设置
  getCompanySettings: (companyId) => api.get(`/company/${companyId}/settings`),
  updateCompanySettings: (companyId, settings) => api.put(`/company/${companyId}/settings`, settings),
};

export const kycAPI = {
  // KYC Application
  submitKYC: (data) => api.post('/kyc/submit', data),
  uploadDocuments: (formData) => api.post('/kyc/upload-documents', formData),
  getKYCStatus: () => api.get('/kyc/status'),
  
  // UBO Management
  addUBO: (data) => api.post('/kyc/ubo', data),
  updateUBO: (uboId, data) => api.put(`/kyc/ubo/${uboId}`, data),
  deleteUBO: (uboId) => api.delete(`/kyc/ubo/${uboId}`),
  
  // Admin Functions
  getKYCApplications: (params) => api.get('/kyc/admin/applications', { params }),
  reviewKYC: (companyId, data) => api.put(`/kyc/admin/review/${companyId}`, data),
};

export const paymentAPI = {
  sendPayment: (data) => api.post('/payment/send', data),
  getHistory: (params) => api.get('/payment/history', { params }),
  getLockedBalances: () => api.get('/payment/locked-balances'),
  releasePayment: (paymentId) => api.post(`/payment/release/${paymentId}`),
};

export const stakeAPI = {
  getStakes: (params) => api.get('/stake', { params }),
  getStakeDetails: (stakeId) => api.get(`/stake/${stakeId}`),
  createStake: (data) => api.post('/stake', data),
  getStats: () => api.get('/stake/stats/summary'),
};

export const depositAPI = {
  // Stripe Integration
  createStripeSession: (data) => api.post('/deposit/create-session', data),
  
  // USDE Balance and Transactions
  getUSDEBalance: (params) => api.get('/deposit/usde-balance', { params }),
  withdrawUSDE: (data) => api.post('/deposit/withdraw', data),
  
  // 新增：订单状态跟踪
  getOrderStatus: (orderId) => api.get(`/deposit/order/${orderId}/status`),
  
  // Deposit History
  getHistory: (params) => api.get('/deposit', { params }),
  getWithdrawalHistory: (params) => api.get('/deposit/withdrawals', { params }),
  completeDeposit: (depositId) => api.post(`/deposit/${depositId}/complete`),
  getStats: () => api.get('/deposit/stats/summary'),
};

export const withdrawalAPI = {
  createWithdrawal: (data) => api.post('/withdrawal', data),
  getHistory: (params) => api.get('/withdrawal', { params }),
  completeWithdrawal: (withdrawalId) => api.post(`/withdrawal/${withdrawalId}/complete`),
  getStats: () => api.get('/withdrawal/stats/summary'),
};

export const bankAccountAPI = {
  getBankAccounts: () => api.get('/bank-account'),
  addBankAccount: (data) => api.post('/bank-account', data),
  updateBankAccount: (accountId, data) => api.put(`/bank-account/${accountId}`, data),
  deleteBankAccount: (accountId) => api.delete(`/bank-account/${accountId}`),
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getEarnings: (params) => api.get('/dashboard/earnings', { params }),
  getPerformance: () => api.get('/dashboard/performance'),
};

export const adminAPI = {
  // User Management
  getUsers: (params) => api.get('/admin/users', { params }),
  getUserDetails: (userId) => api.get(`/admin/users/${userId}`),
  updateUserStatus: (userId, data) => api.put(`/admin/users/${userId}/status`, data),
  updateUser: (userId, data) => api.put(`/admin/users/${userId}`, data),
  deleteUser: (userId) => api.delete(`/admin/users/${userId}`),
  
  // KYC Approval
  getKycApplications: (params) => api.get('/admin/kyc/applications', { params }),
  approveKYC: (userId, data) => api.put(`/admin/kyc/${userId}/approve`, data),
  
  // Withdrawal Management
  getPendingWithdrawals: (params) => api.get('/admin/withdrawals/pending', { params }),
  approveWithdrawal: (withdrawalId, data) => api.put(`/admin/withdrawals/${withdrawalId}/approve`, data),
  
  // Platform Statistics
  getStats: () => api.get('/admin/stats'),
  
  // Audit Logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
}; 

export const settingsAPI = {
  // Get system settings
  getSettings: () => api.get('/settings'),
  
  // Update blockchain settings
  updateBlockchainSettings: (data) => api.put('/settings/blockchain', data),
  
  // Update token economy settings
  updateTokenEconomySettings: (data) => api.put('/settings/token-economy', data),
  
  // Update system settings
  updateSystemSettings: (data) => api.put('/settings/system', data),
  
  // Change admin password
  changePassword: (data) => api.put('/settings/password', data),
};

export const subsidiaryAPI = {
  // Get all companies
  getCompanies: () => api.get('/company'),
  
  // Get subsidiaries of a parent company
  getSubsidiaries: (parentCompanyId) => api.get(`/company/${parentCompanyId}/subsidiaries`),
  
  // Get consolidated balance
  getConsolidatedBalance: (parentCompanyId) => api.get(`/company/${parentCompanyId}/consolidated-balance`),
  
  // Create subsidiary
  createSubsidiary: (data) => api.post('/company/subsidiary', data),
  
  // Update company transfer config
  updateTransferConfig: (companyId, data) => api.put(`/company/${companyId}/transfer-config`, data),
  
  // Get company details
  getCompany: (companyId) => api.get(`/company/${companyId}`),
  
  // Get company transactions
  getCompanyTransactions: (companyId) => api.get(`/company/${companyId}/transactions`),
}; 