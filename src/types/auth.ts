export interface User {
  id: string;
  username: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  bio: string | null;
  created_at?: string;
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
}

export interface LoginCredentials {
  login: string;
  password: string;
  remember_me?: boolean;
}

export interface RegisterCredentials {
  username: string;
  email: string;
  password: string;
  display_name?: string;
}
