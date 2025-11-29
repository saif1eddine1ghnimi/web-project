import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  timeout: 10000, // 10 seconds timeout
});

// ✅ Request interceptor - إرسال الـtoken للـbackend
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    
    // ✅ إرسال أي token (حقيقي أو تجريبي) إلى الـbackend
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
      console.log('🔐 إرسال token إلى الـBackend:', token.substring(0, 20) + '...');
    } else {
      console.log('ℹ️ لا يوجد token - طلب بدون مصادقة');
    }
    
    return config;
  },
  (error) => {
    console.error('❌ خطأ في interceptor الطلب:', error);
    return Promise.reject(error);
  }
);

// ✅ Response interceptor
api.interceptors.response.use(
  (response) => {
    console.log('✅ استجابة ناجحة من الـBackend:', response.config.url);
    return response;
  },
  (error) => {
    console.error('❌ خطأ في استجابة الـBackend:', {
      url: error.config?.url,
      status: error.response?.status,
      message: error.message
    });
    
    if (error.response?.status === 401) {
      // Si le token est un token démo, ne pas le supprimer ni rediriger automatiquement.
      const currentToken = localStorage.getItem('token');
      if (currentToken && currentToken.startsWith('demo-token-')) {
        console.log('⚡ 401 reçu mais token démo — on ignore pour éviter déconnexion automatique');
      } else {
        console.log('🔒 تم اكتشاف خطأ 401 - إعادة التوجيه إلى Login');
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    
    return Promise.reject(error);
  }
);

// Auth APIs
export const authAPI = {
  login: (credentials) => {
    console.log('🔐 محاولة تسجيل الدخول إلى:', `${API_BASE_URL}/auth/login`);
    return api.post('/auth/login', credentials);
  },
  clientLogin: (credentials) => {
    console.log('🔐 محاولة تسجيل دخول عميل إلى:', `${API_BASE_URL}/auth/client-login`);
    return api.post('/auth/client-login', credentials);
  },
};

// Users APIs
export const usersAPI = {
  getAll: () => api.get('/users'),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
};

// Clients APIs
export const clientsAPI = {
  getAll: () => api.get('/clients'),
  getFiles: (clientId) => api.get(`/clients/${clientId}/files`),
  getStats: (clientId) => api.get(`/clients/${clientId}/stats`),
  create: (clientData) => api.post('/clients', clientData),
  update: (id, clientData) => api.put(`/clients/${id}`, clientData),
};

// Files APIs
export const filesAPI = {
  getAll: (params = {}) => api.get('/files', { params }),
  getById: (id) => api.get(`/files/${id}`),
  create: (fileData) => api.post('/files', fileData),
  update: (id, fileData) => api.put(`/files/${id}`, fileData),
  moveToPaid: (id, paidData) => api.post(`/files/${id}/move-to-paid`, paidData),
};

// Tasks APIs
export const tasksAPI = {
  getAll: (params = {}) => api.get('/tasks', { params }),
  getMyTasks: () => api.get('/tasks/my-tasks'),
  create: (taskData) => api.post('/tasks', taskData),
  update: (id, taskData) => api.put(`/tasks/${id}`, taskData),
};

// Expenses APIs
export const expensesAPI = {
  getTypes: () => api.get('/expenses/types'),
  getFileExpenses: (fileId) => api.get(`/expenses/file/${fileId}`),
  add: (expenseData) => api.post('/expenses', expenseData),
  delete: (id) => api.delete(`/expenses/${id}`),
};

// Statistics APIs
export const statsAPI = {
  getDashboard: () => api.get('/stats/dashboard'),
  getClients: () => api.get('/stats/clients'),
  getMonthly: (year) => api.get(`/stats/monthly/${year}`),
};

// Documents APIs
export const documentsAPI = {
  getFileDocuments: (fileId) => api.get(`/documents/file/${fileId}`),
  getClientDocuments: (clientId) => api.get(`/documents/client/${clientId}`),
  upload: (formData) => api.post('/documents/upload', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  }),
  delete: (id) => api.delete(`/documents/${id}`),
};

// Case Types APIs
export const caseTypesAPI = {
  getAll: () => api.get('/case-types'),
  create: (caseTypeData) => api.post('/case-types', caseTypeData),
  delete: (id) => api.delete(`/case-types/${id}`),
};

// Cases APIs
export const casesAPI = {
  getClientCases: (clientId) => api.get(`/cases/client/${clientId}`),
  create: (caseData) => api.post('/cases', caseData),
  update: (id, caseData) => api.put(`/cases/${id}`, caseData),
};

// Case Events APIs
export const caseEventsAPI = {
  getByCaseId: (caseId) => api.get(`/case-events/case/${caseId}`),
  create: (eventData) => api.post('/case-events', eventData),
  delete: (id) => api.delete(`/case-events/${id}`),
};

export default api;