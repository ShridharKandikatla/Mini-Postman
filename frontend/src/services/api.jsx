import axios from 'axios';

const API_BASE_URL =
  import.meta.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle authentication errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401 || error.response?.status === 403) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  signup: (email, password) => api.post('/auth/signup', { email, password }),
  signin: (email, password) => api.post('/auth/signin', { email, password }),
};

export const requestsAPI = {
  getAll: () => api.get('/requests'),
  getOne: (id) => api.get(`/requests/${id}`),
  create: (data) => api.post('/requests', data),
  update: (id, data) => api.put(`/requests/${id}`, data),
  delete: (id) => api.delete(`/requests/${id}`),
};

export const executeAPI = {
  execute: (data) => api.post('/execute', data),
};

export const importAPI = {
  parseCurl: (curlCommand) => api.post('/import/curl', { curlCommand }),
  importPostman: (file) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/import/postman', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export default api;
