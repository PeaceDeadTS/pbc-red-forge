import axios from 'axios';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export const api = axios.create({
  baseURL: `${API_URL}/api/v1`,
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

// Admin API
export const adminApi = {
  // Update user status (ban/unban)
  updateUserStatus: (userId: string, status: string) =>
    api.patch(`/admin/users/${userId}/status`, { status }),

  // Get system stats
  getSystemStats: () => api.get('/admin/stats'),

  // Get site settings
  getSettings: () => api.get('/admin/settings'),

  // Update site settings
  updateSettings: (settings: Record<string, unknown>) =>
    api.patch('/admin/settings', settings),

  // Content moderation
  getContentQueue: (params?: { type?: string; status?: string; limit?: number; offset?: number }) =>
    api.get('/admin/content/queue', { params }),

  // Approve content
  approveContent: (contentId: string, contentType: string) =>
    api.post(`/admin/content/${contentType}/${contentId}/approve`),

  // Reject content
  rejectContent: (contentId: string, contentType: string, reason?: string) =>
    api.post(`/admin/content/${contentType}/${contentId}/reject`, { reason }),

  // Get reports
  getReports: (params?: { status?: string; limit?: number; offset?: number }) =>
    api.get('/admin/reports', { params }),

  // Resolve report
  resolveReport: (reportId: string, action: string, notes?: string) =>
    api.post(`/admin/reports/${reportId}/resolve`, { action, notes }),
};

// Articles API
export const articlesApi = {
  // Get list of articles
  getArticles: (params?: {
    sort?: string;
    order?: string;
    limit?: number;
    offset?: number;
    status?: string;
    author_id?: string;
    tag?: string;
    search?: string;
  }) => api.get('/articles', { params }),

  // Get all tags
  getTags: () => api.get('/articles/tags'),

  // Get current user's articles
  getMyArticles: (params?: { sort?: string; order?: string; limit?: number; offset?: number }) =>
    api.get('/articles/my', { params }),

  // Get current user's article stats
  getMyStats: () => api.get('/articles/my/stats'),

  // Check if user can create articles
  canCreate: () => api.get('/articles/can-create'),

  // Get articles by user ID
  getUserArticles: (userId: string, params?: { sort?: string; order?: string; limit?: number; offset?: number }) =>
    api.get(`/articles/user/${userId}`, { params }),

  // Get single article by ID or slug
  getArticle: (idOrSlug: string) => api.get(`/articles/${idOrSlug}`),

  // Create new article
  create: (data: {
    title: string;
    slug?: string;
    header_image?: string | null;
    excerpt?: string | null;
    content: string;
    tags?: string[];
    status?: string;
  }) => api.post('/articles', data),

  // Update article
  update: (id: string, data: {
    title?: string;
    slug?: string;
    header_image?: string | null;
    excerpt?: string | null;
    content?: string;
    tags?: string[];
    status?: string;
  }) => api.patch(`/articles/${id}`, data),

  // Update article status
  updateStatus: (id: string, status: string) =>
    api.patch(`/articles/${id}/status`, { status }),

  // Delete article
  delete: (id: string) => api.delete(`/articles/${id}`),
};

// Reactions API
export const reactionsApi = {
  // Toggle reaction (like/unlike)
  toggle: (data: { target_type: string; target_id: string; reaction_type?: string }) =>
    api.post('/reactions/toggle', data),

  // Get reaction stats for a single target
  getStats: (params: { target_type: string; target_id: string }) =>
    api.get('/reactions/stats', { params }),

  // Get reaction stats for multiple targets (batch)
  getBatch: (data: { target_type: string; target_ids: string[] }) =>
    api.post('/reactions/batch', data),

  // Get current user's reactions
  getMyReactions: (params?: { target_type?: string; limit?: number; offset?: number }) =>
    api.get('/reactions/my', { params }),
};
