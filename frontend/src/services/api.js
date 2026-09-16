import axios from 'axios';

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL ||
           (window.electronAPI ? 'http://localhost:8000' : 'http://localhost:8000'), // Mismo para ambos casos por ahora
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    // No establecer Content-Type para FormData, el navegador lo hará automáticamente
    if (config.data instanceof FormData) {
      delete config.headers['Content-Type'];
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor
api.interceptors.response.use(
  (response) => {
    return response;
  },
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
  login: async (credentials) => {
    return await api.post('/api/v1/auth/login-form', credentials);
  },
  
  me: async () => {
    return await api.get('/api/v1/auth/me');
  },
};

export const quotationsAPI = {
  getAll: (params) => api.get('/api/v1/quotations/', { params }),
  getById: (id) => api.get(`/api/v1/quotations/${id}`),
  getByNumber: (number) => api.get(`/api/v1/quotations/number/${number}`),
  create: (data) => api.post('/api/v1/quotations/', data),
  update: (id, data) => api.put(`/api/v1/quotations/${id}`, data),
  updateStatus: (id, status) => api.patch(`/api/v1/quotations/${id}/status`, null, { params: { status } }),
  advanceStage: (id, newStage, note) => api.patch(`/api/v1/quotations/${id}/stage`, null, { params: { new_stage: newStage, note } }),
  getStatusHistory: (id) => api.get(`/api/v1/quotations/${id}/history/status`),
  getStageHistory: (id) => api.get(`/api/v1/quotations/${id}/history/stage`),
  delete: (id) => api.delete(`/api/v1/quotations/${id}`),
  discard: (id, reason) => api.patch(`/api/v1/quotations/${id}/discard?reason=${reason}`),
  getPDF: (id) => api.get(`/api/v1/quotations/${id}/pdf`, { responseType: 'blob' }),
  getDashboard: () => api.get('/api/v1/quotations/dashboard'),
  getReports: (params) => api.get('/api/v1/quotations/reports/summary', { params }),
  getDetailedReport: (params) => api.get('/api/v1/quotations/reports/detailed', { params }),
  getHotQuotations: (params) => api.get('/api/v1/quotations/hot/quotations', { params }),
  getClientHistory: (clientId, params) => api.get(`/api/v1/quotations/client/${clientId}/history`, { params }),
  getByClient: (clientId, params) => api.get(`/api/v1/quotations/client/${clientId}`, { params }),
};

export const clientsAPI = {
  getAll: (params) => api.get('/api/v1/clients/', { params }),
  getById: (id) => api.get(`/api/v1/clients/${id}`),
  create: (data) => api.post('/api/v1/clients/', data),
  update: (id, data) => api.put(`/api/v1/clients/${id}`, data),
  delete: (id) => api.delete(`/api/v1/clients/${id}`),
};

export const alertsAPI = {
  getAll: (params) => api.get('/api/v1/alerts/', { params }),
  create: (data) => api.post('/api/v1/alerts/', data),
  getPending: () => api.get('/api/v1/alerts/pending'),
  getCount: () => api.get('/api/v1/alerts/count'),
  getById: (id) => api.get(`/api/v1/alerts/${id}`),
  markAsRead: (id) => api.patch(`/api/v1/alerts/${id}/read`),
  markAsUnread: (id) => api.patch(`/api/v1/alerts/${id}/unread`),
  markAllAsRead: () => api.patch('/api/v1/alerts/read-all'),
  delete: (id) => api.delete(`/api/v1/alerts/${id}`),
};

export const usersAPI = {
  getAll: (params) => api.get('/api/v1/users/', { params }),
  getById: (id) => api.get(`/api/v1/users/${id}`),
  create: (data) => api.post('/api/v1/users/', data),
  update: (id, data) => api.put(`/api/v1/users/${id}`, data),
  delete: (id) => api.delete(`/api/v1/users/${id}`),
};

export const websocketAPI = {
  getStats: () => api.get('/api/v1/ws/connections/stats'),
};

// New API modules
export const documentsAPI = {
  getTypes: () => api.get('/api/v1/documents/types'),
  createType: (data) => api.post('/api/v1/documents/types', data),
  uploadDocument: (quotationId, formData) => api.post(`/api/v1/documents/quotations/${quotationId}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getByQuotation: (quotationId) => api.get(`/api/v1/documents/quotations/${quotationId}`),
  updateStatus: (documentId, status, note) => api.patch(`/api/v1/documents/${documentId}/status`, null, { 
    params: { status, note } 
  }),
};

export const creditAPI = {
  createApplication: (data) => api.post('/api/v1/credit/applications', data),
  getApplications: (params) => api.get('/api/v1/credit/applications', { params }),
  approveApplication: (data) => api.post('/api/v1/credit/approvals', data),
  addGuarantee: (data) => api.post('/api/v1/credit/guarantees', data),
  getByQuotation: (quotationId) => api.get(`/api/v1/credit/quotation/${quotationId}`),
};

export const paymentsAPI = {
  createSchedule: (data) => api.post('/api/v1/billing/schedule', data),
  createScheduleWithType: (data) => api.post('/api/v1/billing/schedule-with-type', data),
  getSchedules: (params) => api.get('/api/v1/billing/schedules', { params }),
  getSchedule: (quotationId) => api.get(`/api/v1/billing/schedule/${quotationId}`),
  getScheduleByQuotation: (quotationId) => api.get(`/api/v1/billing/schedule/${quotationId}`),
  registerPayment: (data) => api.post('/api/v1/billing/payments', data),
};

export const inventoryAPI = {
  createVehicle: (formData) => api.post('/api/v1/inventory/vehicles', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  updateVehicle: (id, formData) => api.put(`/api/v1/inventory/vehicles/${id}`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getVehicles: (params) => api.get('/api/v1/inventory/vehicles', { params }),
  getVehicleById: (id) => api.get(`/api/v1/inventory/vehicles/${id}`),
  assignVehicle: (data) => api.post('/api/v1/inventory/assignments', data),
  createDelivery: (data) => api.post('/api/v1/inventory/deliveries', data),
  getDeliveries: (params) => api.get('/api/v1/inventory/deliveries', { params }),
  getByQuotation: (quotationId) => api.get(`/api/v1/inventory/quotation/${quotationId}`),
  uploadDeliveryPhoto: (deliveryId, formData) => api.post(`/api/v1/inventory/deliveries/${deliveryId}/photos`, formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  getVehicleImage: (filename) => {
    const apiBaseUrl = process.env.REACT_APP_API_URL || 'http://localhost:8000';
    return `${apiBaseUrl}/api/v1/inventory/vehicles/images/${filename}`;
  },
};

export const reportsAPI = {
  getPipeline: () => api.get('/api/v1/reports/pipeline'),
  getAlerts: () => api.get('/api/v1/reports/alerts'),
  getBilling: (start, end) => api.get('/api/v1/reports/billing', { params: { start, end } }),
};

export const seedersAPI = {
  seedUsers: () => api.post('/api/v1/seeders/users'),
};

export const notificationsAPI = {
  testWS: () => api.post('/api/v1/notifications/test/ws'),
};

export default api;