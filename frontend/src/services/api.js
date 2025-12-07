import axios from 'axios';

// Base URL untuk API Laravel
const API_BASE_URL = 'http://127.0.0.1:8000/api';

// Create axios instance with optimized timeout
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  withCredentials: true,
  timeout: 30000, // 30s timeout - lebih generous untuk menghindari cancel prematur
});

// Add token to requests if exists
api.interceptors.request.use(
  (config) => {
    // Only add token for protected routes (not login)
    if (!config.url.includes('/login')) {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Handle response errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Handle 401 - Unauthorized (tapi tidak untuk login endpoint)
    if (error.response?.status === 401 && !error.config?.url?.includes('/login')) {
      // Clear invalid token
      localStorage.removeItem('token');
      localStorage.removeItem('user');

      // Only redirect if not on login page
      if (!window.location.pathname.includes('/login') && window.location.pathname !== '/') {
        window.location.href = '/';
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: async (email, password) => {
    try {
      const response = await api.post('/login', {
        email: email.trim(),
        password
      });
      return response.data;
    } catch (error) {
      // Re-throw with better error info
      if (error.response) {
        throw error;
      } else if (error.request) {
        // Request dibuat tapi tidak ada response
        const networkError = new Error('Tidak dapat terhubung ke server');
        networkError.code = 'ERR_NETWORK';
        throw networkError;
      } else {
        throw error;
      }
    }
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

  // Get dashboard data
  getDashboard: async () => {
    const response = await api.get('/dosen/dashboard');
    return response.data;
  },

  // Cancel seminar
  cancelSeminar: async (id, data) => {
    // data: { cancel_reason: string }
    const response = await api.post(`/dosen/seminars/${id}/cancel`, data);
    return response.data;
  },

  // Get revisions (for dosen to validate)
  getRevisions: async () => {
    const response = await api.get('/dosen/revisions');
    return response.data;
  },

  // Validate revision
  validateRevision: async (id, data) => {
    // data: { status: 'accepted'|'rejected', catatan_dosen?: string }
    const response = await api.post(`/dosen/revisions/${id}/validate`, data);
    return response.data;
  },

  // Check-in for seminar
  checkIn: async (data) => {
    // data: { seminar_schedule_id: number }
    const response = await api.post('/dosen/seminars/check-in', data);
    return response.data;
  },

  // Get attendance history
  getAttendanceHistory: async () => {
    const response = await api.get('/dosen/attendance/history');
    return response.data;
  },
};

// Admin API
export const adminAPI = {
  // Dashboard & Overview
  getDashboard: async () => {
    const response = await api.get('/admin/dashboard');
    return response.data;
  },

  getSystemOverview: async () => {
    const response = await api.get('/admin/system-overview');
    return response.data;
  },

  // Verification
  getSeminarsForVerification: async (status = 'all') => {
    const response = await api.get('/admin/verification/seminars', {
      params: { status }
    });
    return response.data;
  },

  getPendingVerification: async () => {
    const response = await api.get('/admin/verification/seminars/pending');
    return response.data;
  },

  getSeminarDetail: async (id) => {
    const response = await api.get(`/admin/verification/seminars/${id}`);
    return response.data;
  },

  verifySeminar: async (id, data) => {
    // data: { status: 'approved'|'rejected', catatan?: string }
    const response = await api.post(`/admin/verification/seminars/${id}/verify`, data);
    return response.data;
  },

  getVerificationStatistics: async () => {
    const response = await api.get('/admin/verification/statistics');
    return response.data;
  },

  // Schedule Management
  getSchedules: async () => {
    const response = await api.get('/admin/schedules');
    return response.data;
  },

  getAvailableSeminars: async () => {
    const response = await api.get('/admin/schedules/available-seminars');
    return response.data;
  },

  createSchedule: async (data) => {
    // data: { seminar_id, waktu_mulai, durasi_menit, ruang }
    const response = await api.post('/admin/schedules', data);
    return response.data;
  },

  updateSchedule: async (id, data) => {
    const response = await api.put(`/admin/schedules/${id}`, data);
    return response.data;
  },

  deleteSchedule: async (id) => {
    const response = await api.delete(`/admin/schedules/${id}`);
    return response.data;
  },

  getScheduleStatistics: async () => {
    const response = await api.get('/admin/schedules/statistics');
    return response.data;
  },

  // QR Code
  generateQR: async (scheduleId) => {
    const response = await api.post(`/admin/qr-codes/generate/${scheduleId}`); // Route: POST /qr-codes/generate/{id}
    return response.data;
  },

  getQRCode: async (scheduleId) => {
    const response = await api.get(`/admin/qr-codes/${scheduleId}`);
    return response.data;
  },

  regenerateQR: async (scheduleId) => {
    const response = await api.post(`/admin/qr-codes/regenerate/${scheduleId}`);
    return response.data;
  },

  // Attendance Management
  getAttendances: async () => {
    const response = await api.get('/admin/attendances');
    return response.data;
  },

  getScheduleAttendances: async (scheduleId) => {
    const response = await api.get(`/admin/attendances/schedule/${scheduleId}`);
    return response.data;
  },

  getAttendanceStatistics: async () => {
    const response = await api.get('/admin/attendances/statistics');
    return response.data;
  },

  manualAttendance: async (data) => {
    // data: { seminar_schedule_id, mahasiswa_id, status: 'present'|'late' }
    const response = await api.post('/admin/attendances/manual', data);
    return response.data;
  },

  deleteAttendance: async (attendanceId) => {
    const response = await api.delete(`/admin/attendances/${attendanceId}`);
    return response.data;
  },

  getMahasiswaList: async () => {
    const response = await api.get('/admin/attendances/mahasiswa-list');
    return response.data;
  },

  getMahasiswaAttendanceHistory: async (mahasiswaId) => {
    const response = await api.get(`/admin/attendances/mahasiswa/${mahasiswaId}/history`);
    return response.data;
  },

  // Revision Management
  getRevisions: async (status = null) => {
    const params = status ? { status } : {};
    const response = await api.get('/admin/revisions', { params });
    return response.data;
  },

  getRevisionDetail: async (id) => {
    const response = await api.get(`/admin/revisions/${id}`);
    return response.data;
  },

  validateRevision: async (id, data) => {
    // data: { status: 'accepted'|'rejected', catatan_admin?: string }
    const response = await api.post(`/admin/revisions/${id}/validate`, data);
    return response.data;
  },

  getRevisionStatistics: async () => {
    const response = await api.get('/admin/revisions/statistics');
    return response.data;
  },
};

// Notification API
export const notificationAPI = {
  getNotifications: async (page = 1) => {
    const response = await api.get('/notifications', { params: { page } });
    return response.data;
  },

  getUnreadCount: async () => {
    const response = await api.get('/notifications/unread-count');
    return response.data;
  },

  markAsRead: async (id) => {
    const response = await api.post(`/notifications/${id}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await api.post('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (id) => {
    const response = await api.delete(`/notifications/${id}`);
    return response.data;
  },
};

// Mahasiswa API
export const mahasiswaAPI = {
  getAttendanceHistory: async () => {
    const response = await api.get('/mahasiswa/attendance/history');
    return response.data;
  },

  scanQR: async (data) => {
    // data: { qr_token: string }
    const response = await api.post('/mahasiswa/attendance/scan-qr', data);
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
