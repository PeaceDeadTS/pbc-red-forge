import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api`,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to attach auth token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('auth_token');
      localStorage.removeItem('auth_user');
      // Could add redirect to login page here
    }
    return Promise.reject(error);
  }
);

// Auth API
export const authApi = {
  register: (data: { username: string; email: string; password: string; display_name?: string }) =>
    api.post('/auth/register', data),

  login: (data: { login: string; password: string; remember_me?: boolean }) =>
    api.post('/auth/login', data),

  logout: () => api.post('/auth/logout'),

  logoutAll: () => api.post('/auth/logout-all'),

  me: () => api.get('/auth/me'),
};

// Users API
export const usersApi = {
  getProfile: (id: string) => api.get(`/users/${id}`),

  updateProfile: (data: { display_name?: string; bio?: string; avatar_url?: string | null }) =>
    api.patch('/users/me', data),

  changePassword: (data: { current_password: string; new_password: string }) =>
    api.post('/users/me/change-password', data),

  // Get list of users with pagination and sorting
  getUsers: (params?: { sort?: string; order?: string; limit?: number; offset?: number }) =>
    api.get('/users', { params }),

  // Get all available groups
  getGroups: () => api.get('/users/groups/list'),

  // Update user groups (admin only)
  updateUserGroups: (userId: string, groups: string[]) =>
    api.patch(`/users/${userId}/groups`, { groups }),
};
