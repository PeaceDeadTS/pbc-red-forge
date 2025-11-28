import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { authApi } from '@/lib/api';
import { User, AuthState, LoginCredentials, RegisterCredentials } from '@/types/auth';

interface AuthContextType extends AuthState {
  login: (credentials: LoginCredentials) => Promise<void>;
  register: (credentials: RegisterCredentials) => Promise<void>;
  logout: () => Promise<void>;
  logoutAll: () => Promise<void>;
  updateUser: (user: User) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [state, setState] = useState<AuthState>({
    user: null,
    token: null,
    isAuthenticated: false,
    isLoading: true,
  });

  // Проверка токена при загрузке
  useEffect(() => {
    const initAuth = async () => {
      const token = localStorage.getItem('auth_token');
      const savedUser = localStorage.getItem('auth_user');

      if (token && savedUser) {
        try {
          // Проверяем валидность токена
          const response = await authApi.me();
          const user = response.data.user;

          setState({
            user,
            token,
            isAuthenticated: true,
            isLoading: false,
          });

          // Обновляем сохранённые данные
          localStorage.setItem('auth_user', JSON.stringify(user));
        } catch {
          // Токен невалиден
          localStorage.removeItem('auth_token');
          localStorage.removeItem('auth_user');
          setState({
            user: null,
            token: null,
            isAuthenticated: false,
            isLoading: false,
          });
        }
      } else {
        setState((prev) => ({ ...prev, isLoading: false }));
      }
    };

    initAuth();
  }, []);

  const login = useCallback(async (credentials: LoginCredentials) => {
    const response = await authApi.login(credentials);
    const { token, user } = response.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const register = useCallback(async (credentials: RegisterCredentials) => {
    const response = await authApi.register(credentials);
    const { token, user } = response.data;

    localStorage.setItem('auth_token', token);
    localStorage.setItem('auth_user', JSON.stringify(user));

    setState({
      user,
      token,
      isAuthenticated: true,
      isLoading: false,
    });
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      // Игнорируем ошибки при выходе
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const logoutAll = useCallback(async () => {
    try {
      await authApi.logoutAll();
    } catch {
      // Игнорируем ошибки
    }

    localStorage.removeItem('auth_token');
    localStorage.removeItem('auth_user');

    setState({
      user: null,
      token: null,
      isAuthenticated: false,
      isLoading: false,
    });
  }, []);

  const updateUser = useCallback((user: User) => {
    localStorage.setItem('auth_user', JSON.stringify(user));
    setState((prev) => ({ ...prev, user }));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        ...state,
        login,
        register,
        logout,
        logoutAll,
        updateUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};
