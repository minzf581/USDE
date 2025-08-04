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
  updateProfile: (data) => api.put('/company/profile', data),
  uploadKYC: (formData) => api.post('/company/kyc/upload', formData),
  getKYCStatus: () => api.get('/company/kyc/status'),
  updateKYCStatus: (companyId, status) => api.put(`/company/kyc/status/${companyId}`, { status }),
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
  createStripeSession: (amount) => api.post('/deposit/create-session', { amount }),
  
  // USDE Balance and Transactions
  getUSDEBalance: (params) => api.get('/deposit/usde-balance', { params }),
  withdrawUSDE: (data) => api.post('/deposit/withdraw', data),
  
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
  
  // KYC Approval
  approveKYC: (userId, data) => api.put(`/admin/kyc/${userId}/approve`, data),
  
  // Withdrawal Management
  getPendingWithdrawals: (params) => api.get('/admin/withdrawals/pending', { params }),
  approveWithdrawal: (withdrawalId, data) => api.put(`/admin/withdrawals/${withdrawalId}/approve`, data),
  
  // Platform Statistics
  getStats: () => api.get('/admin/stats'),
  
  // Audit Logs
  getAuditLogs: (params) => api.get('/admin/audit-logs', { params }),
}; 