import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

const api = axios.create({
  baseURL: API_BASE_URL,
});

// Add token to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export const authAPI = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (name, email, password) => api.post('/auth/register', { name, email, password }),
};

export const documentsAPI = {
  getDocuments: () => api.get('/documents'),
  uploadDocument: (formData) => api.post('/documents/upload', formData),
  deleteDocument: (id) => api.delete(`/documents/${id}`),
  updateDocument: (id, data) => api.put(`/documents/${id}`, data),
};

export const commentsAPI = {
  getComments: (documentId) => api.get(`/comments/${documentId}`),
  addComment: (documentId, comment) => api.post('/comments', { documentId, comment }),
  deleteComment: (id) => api.delete(`/comments/${id}`),
};

export const usersAPI = {
  getUsers: () => api.get('/users'),
  addUser: (user) => api.post('/users', user),
  updateUser: (id, user) => api.put(`/users/${id}`, user),
  deleteUser: (id) => api.delete(`/users/${id}`),
  updateProfile: (id, data) => api.put(`/users/${id}`, data),
  changePassword: (id, oldPassword, newPassword) => api.post(`/users/${id}/change-password`, { oldPassword, newPassword }),
};

export const categoriesAPI = {
  getCategories: () => api.get('/categories'),
  addCategory: (category) => api.post('/categories', category),
  deleteCategory: (id) => api.delete(`/categories/${id}`),
};

export const statsAPI = {
  getStats: () => api.get('/stats'),
  getUserStats: (userId) => api.get(`/stats/user/${userId}`),
};

export default api;
