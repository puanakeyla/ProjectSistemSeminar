import axios from 'axios';

// Base URL untuk API Laravel
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
});

// Add token to requests if exists
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

// Auth API
export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/login', { email, password });
    return response.data;
  },
  
  logout: async () => {
    const response = await api.post('/logout');
    return response.data;
  },
  
  getUser: async () => {
    const response = await api.get('/user');
    return response.data;
  },
};

// Dosen API
export const dosenAPI = {
  // Get pending approvals
  getPendingApprovals: async () => {
    const response = await api.get('/dosen/approvals/pending');
    return response.data;
  },

  // Get approval history
  getApprovalHistory: async (status = 'all') => {
    const response = await api.get('/dosen/approvals/history', { 
      params: { status } 
    });
    return response.data;
  },

  // Get specific approval detail
  getApprovalDetail: async (id) => {
    const response = await api.get(`/dosen/approvals/${id}`);
    return response.data;
  },

  // Update approval (approve/reject with dates)
  updateApproval: async (id, data) => {
    // data: { status: 'approved'|'rejected', catatan?: string, available_dates?: string[] }
    const response = await api.put(`/dosen/approvals/${id}`, data);
    return response.data;
  },

  // Get seminars where dosen is involved
  getMySeminars: async (status = 'all') => {
    const response = await api.get('/dosen/seminars', { 
      params: { status } 
    });
    return response.data;
  },

  // Get statistics
  getStatistics: async () => {
    const response = await api.get('/dosen/statistics');
    return response.data;
  },
};

// Health check
export const healthCheck = async () => {
  try {
    const response = await axios.get('http://127.0.0.1:8000/health');
    return response.data;
  } catch (error) {
    console.error('Health check failed:', error);
    return null;
  }
};

export default api;
