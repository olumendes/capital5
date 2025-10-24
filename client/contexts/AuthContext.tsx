import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, UserCreate, UserLogin } from '@shared/database-types';
import apiService from '../services/apiService';

interface AuthState {
  user: User | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  error: string | null;
}

interface AuthContextType extends AuthState {
  login: (credentials: UserLogin) => Promise<boolean>;
  register: (userData: UserCreate) => Promise<boolean>;
  logout: () => void;
  clearError: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const isTestMode = () => {
  if (typeof window === 'undefined') {
    return false;
  }

  // Verificar parâmetro de URL
  const params = new URLSearchParams(window.location.search);
  const urlTestMode = params.get('testMode') === 'true';

  // Se encontrou na URL, salvar em sessionStorage
  if (urlTestMode) {
    sessionStorage.setItem('testMode', 'true');
    return true;
  }

  // Verificar sessionStorage (persiste durante a sessão)
  const sessionTestMode = sessionStorage.getItem('testMode') === 'true';
  if (sessionTestMode) {
    return true;
  }

  // Verificar variável de ambiente
  const envTestMode = (import.meta as any).env?.VITE_TEST_MODE === 'true';
  if (envTestMode) {
    sessionStorage.setItem('testMode', 'true');
    return true;
  }

  return false;
};

const createTestUser = (): User => {
  return {
    id: 'test-user-001',
    name: 'Usuário Teste',
    email: 'test@example.com',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
};

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
    error: null
  });

  // Verificar autenticação inicial
  useEffect(() => {
    const checkAuth = async () => {
      // Verificar modo de teste
      const testModeActive = isTestMode();
      if (testModeActive) {
        console.log('[TEST MODE] Autenticando usuário de teste');
        const testUser = createTestUser();
        setState({
          user: testUser,
          isLoading: false,
          isAuthenticated: true,
          error: null
        });
        return;
      }

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
            error: null
          });
        } else {
          setState({
            user: null,
            isLoading: false,
            isAuthenticated: false,
            error: null
          });
        }
      } catch (error) {
        console.error('Erro na verificação de autenticação:', error);
        setState({
          user: null,
          isLoading: false,
          isAuthenticated: false,
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
    sessionStorage.removeItem('testMode');
    setState({
      user: null,
      isLoading: false,
      isAuthenticated: false,
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
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}
