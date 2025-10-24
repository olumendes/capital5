import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserCreate, UserLogin } from '@shared/database-types';
import apiService from '../services/apiService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  isDemoMode: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: UserLogin) => Promise<boolean>;
  register: (userData: UserCreate) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
  enterDemoMode: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [state, setState] = useState<AuthState>({
    user: null,
    isLoading: true,
    isAuthenticated: false,
    isDemoMode: false,
    error: null
  });

  // Verificar autenticação inicial
  useEffect(() => {
    const checkAuth = async () => {
      if (!apiService.isAuthenticated()) {
        setState(prev => ({ ...prev, isLoading: false }));
        return;
      }

      try {
        const user = await apiService.verifyToken();

        if (user) {
          setState({
            user,
            isLoading: false,
            isAuthenticated: true,
            isDemoMode: false,
            error: null
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            isDemoMode: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
          isDemoMode: false,
          error: 'Erro na verificação de autenticação'
        });
      }
    };

    checkAuth();
  }, []);

  const login = async (credentials: UserLogin): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.login(credentials);
      
      if (response.success && response.user) {
        setState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: false,
          error: null
        });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Erro no login'
        }));
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro no login';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
      return false;
    }
  };

  const register = async (userData: UserCreate): Promise<boolean> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const response = await apiService.register(userData);
      
      if (response.success && response.user) {
        setState({
          user: response.user,
          isLoading: false,
          isAuthenticated: true,
          isDemoMode: false,
          error: null
        });
        return true;
      } else {
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: response.message || 'Erro no registro'
        }));
        return false;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro no registro';
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: message
      }));
      return false;
    }
  };

  const logout = () => {
    apiService.logout();
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isDemoMode: false,
      error: null
    });
  };

  const enterDemoMode = () => {
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
      isDemoMode: true,
      error: null
    });
  };

  const clearError = () => {
    setState(prev => ({ ...prev, error: null }));
  };

  const value: AuthContextType = {
    ...state,
    login,
    register,
    logout,
    clearError,
    enterDemoMode
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
