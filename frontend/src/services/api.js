import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

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

export const paymentAPI = {
  sendPayment: (data) => api.post('/payment/send', data),
  getHistory: (params) => api.get('/payment/history', { params }),
  releasePayment: (paymentId) => api.post(`/payment/release/${paymentId}`),
};

export const stakeAPI = {
  getStakes: (params) => api.get('/stake', { params }),
  getStakeDetails: (stakeId) => api.get(`/stake/${stakeId}`),
  createStake: (data) => api.post('/stake', data),
  getStats: () => api.get('/stake/stats/summary'),
};

export const depositAPI = {
  createDeposit: (data) => api.post('/deposit', data),
  getHistory: (params) => api.get('/deposit', { params }),
  completeDeposit: (depositId) => api.post(`/deposit/${depositId}/complete`),
  getStats: () => api.get('/deposit/stats/summary'),
};

export const withdrawalAPI = {
  createWithdrawal: (data) => api.post('/withdrawal', data),
  getHistory: (params) => api.get('/withdrawal', { params }),
  completeWithdrawal: (withdrawalId) => api.post(`/withdrawal/${withdrawalId}/complete`),
  getStats: () => api.get('/withdrawal/stats/summary'),
};

export const dashboardAPI = {
  getDashboard: () => api.get('/dashboard'),
  getEarnings: (params) => api.get('/dashboard/earnings', { params }),
  getPerformance: () => api.get('/dashboard/performance'),
}; 