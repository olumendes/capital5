import {
  User,
  UserCreate,
  UserLogin,
  AuthResponse,
  ApiResponse,
  PaginatedResponse,
  CreateTransactionRequest,
  UpdateTransactionRequest,
  CreateInvestmentRequest,
  UpdateInvestmentRequest,
  CreateGoalRequest,
  UpdateGoalRequest,
  CreateBudgetDivisionRequest,
  UpdateBudgetDivisionRequest,
  CreateBudgetCategoryRequest,
  UpdateBudgetCategoryRequest,
  TransactionFilters
} from '@shared/database-types';
import { localStorageService } from './localStorageService';

class ApiService {
  private baseUrl: string;
  private token: string | null = null;

  private isTestMode(): boolean {
    if (typeof window === 'undefined') return false;
    return sessionStorage.getItem('testMode') === 'true';
  }

  constructor() {
    // Detectar base da API (permite override por env)
    // Ex.: defina VITE_API_BASE_URL para apontar para seu Worker/Netlify Functions
    const envBase = (typeof import.meta !== 'undefined' && (import.meta as any).env && (import.meta as any).env.VITE_API_BASE_URL) || undefined;
    if (envBase && typeof envBase === 'string' && envBase.trim().length > 0) {
      this.baseUrl = envBase.replace(/\/$/, '');
    } else if (typeof window !== 'undefined' && window.location?.origin) {
      this.baseUrl = window.location.origin;
    } else {
      this.baseUrl = 'http://localhost:5173';
    }

    // Carregar token do localStorage
    this.loadToken();
  }

  private loadToken() {
    if (typeof window !== 'undefined') {
      this.token = localStorage.getItem('auth-token');
    }
  }

  private saveToken(token: string) {
    this.token = token;
    if (typeof window !== 'undefined') {
      localStorage.setItem('auth-token', token);
    }
  }

  private clearToken() {
    this.token = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('auth-token');
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    return headers;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;

    const config: RequestInit = {
      ...options,
      headers: {
        ...this.getHeaders(),
        ...options.headers,
      },
    };

    try {
      const response = await fetch(url, config);
      const contentType = response.headers.get('content-type') || '';
      const isJson = contentType.includes('application/json');
      const body = isJson ? await response.json() : await response.text();

      if (!response.ok) {
        // Extrair mensagem amigável do corpo
        const message = isJson
          ? (body.error || body.message || `HTTP ${response.status}`)
          : (typeof body === 'string' && body.trim().length ? body : `HTTP ${response.status}`);
        throw new Error(message);
      }

      if (!isJson) {
        // Quando a API não retornar JSON, padronizamos como sucesso genérico
        return { success: true, data: body as unknown as T };
      }

      return body as ApiResponse<T>;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // ========== AUTENTICAÇÃO ==========
  async register(userData: UserCreate): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    if (response.data?.token) {
      this.saveToken(response.data.token);
    }

    return response.data!;
  }

  async login(credentials: UserLogin): Promise<AuthResponse> {
    const response = await this.request<AuthResponse>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    if (response.data?.token) {
      this.saveToken(response.data.token);
    }

    return response.data!;
  }

  async verifyToken(): Promise<User | null> {
    if (!this.token) {
      return null;
    }

    try {
      const response = await this.request<AuthResponse>('/api/auth/verify', {
        method: 'POST',
      });

      return response.data?.user || null;
    } catch (error) {
      // Token inválido, limpar
      this.clearToken();
      return null;
    }
  }

  logout() {
    this.clearToken();
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  // ========== CATEGORIAS ==========
  async getCategories() {
    if (this.isTestMode()) {
      return localStorageService.getCategories();
    }
    const response = await this.request('/api/categories');
    return response.data;
  }

  async createCategory(category: any) {
    if (this.isTestMode()) {
      return localStorageService.createCategory({
        ...category,
        user_id: 'test-user-001',
        is_default: false,
      });
    }
    const response = await this.request('/api/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return response.data;
  }

  async deleteCategory(categoryId: string) {
    if (this.isTestMode()) {
      return localStorageService.deleteCategory(categoryId);
    }
    await this.request(`/api/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }

  // ========== TRANSAÇÕES ==========
  async getTransactions(filters?: TransactionFilters) {
    if (this.isTestMode()) {
      let transactions = await localStorageService.getTransactions();

      // Apply filters if provided
      if (filters) {
        if (filters.type) {
          transactions = transactions.filter(t => t.type === filters.type);
        }
        if (filters.category_id) {
          transactions = transactions.filter(t => t.category_id === filters.category_id);
        }
        if (filters.start_date) {
          transactions = transactions.filter(t => new Date(t.date) >= new Date(filters.start_date!));
        }
        if (filters.end_date) {
          transactions = transactions.filter(t => new Date(t.date) <= new Date(filters.end_date!));
        }
      }

      return transactions;
    }

    let endpoint = '/api/transactions';

    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });

      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const response = await this.request<any[]>(endpoint);
    return response.data;
  }

  async createTransaction(transaction: CreateTransactionRequest) {
    if (this.isTestMode()) {
      return localStorageService.createTransaction({
        ...transaction,
        user_id: 'test-user-001',
        source: 'manual',
      });
    }

    const response = await this.request('/api/transactions', {
      method: 'POST',
      body: JSON.stringify(transaction),
    });
    return response.data;
  }

  async updateTransaction(transaction: UpdateTransactionRequest) {
    if (this.isTestMode()) {
      return localStorageService.updateTransaction(transaction.id, transaction);
    }

    const response = await this.request(`/api/transactions/${transaction.id}`, {
      method: 'PUT',
      body: JSON.stringify(transaction),
    });
    return response.data;
  }

  async deleteTransaction(transactionId: string) {
    if (this.isTestMode()) {
      return localStorageService.deleteTransaction(transactionId);
    }

    await this.request(`/api/transactions/${transactionId}`, {
      method: 'DELETE',
    });
  }

  // ========== INVESTIMENTOS ==========
  async getInvestments(filters?: any) {
    let endpoint = '/api/investments';
    
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const response = await this.request(endpoint);
    return response.data;
  }

  async createInvestment(investment: CreateInvestmentRequest) {
    const response = await this.request('/api/investments', {
      method: 'POST',
      body: JSON.stringify(investment),
    });
    return response.data;
  }

  async updateInvestment(investment: UpdateInvestmentRequest) {
    const response = await this.request(`/api/investments/${investment.id}`, {
      method: 'PUT',
      body: JSON.stringify(investment),
    });
    return response.data;
  }

  async deleteInvestment(investmentId: string) {
    await this.request(`/api/investments/${investmentId}`, {
      method: 'DELETE',
    });
  }

  // ========== OBJETIVOS ==========
  async getGoals(filters?: any) {
    let endpoint = '/api/goals';
    
    if (filters) {
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          params.append(key, value.toString());
        }
      });
      
      if (params.toString()) {
        endpoint += `?${params.toString()}`;
      }
    }

    const response = await this.request(endpoint);
    return response.data;
  }

  async createGoal(goal: CreateGoalRequest) {
    const response = await this.request('/api/goals', {
      method: 'POST',
      body: JSON.stringify(goal),
    });
    return response.data;
  }

  async updateGoal(goal: UpdateGoalRequest) {
    const response = await this.request(`/api/goals/${goal.id}`, {
      method: 'PUT',
      body: JSON.stringify(goal),
    });
    return response.data;
  }

  async deleteGoal(goalId: string) {
    await this.request(`/api/goals/${goalId}`, {
      method: 'DELETE',
    });
  }

  // ========== DIVISÃO FINANCEIRA ==========
  async getBudgetDivisions() {
    const response = await this.request('/api/budget/divisions');
    return response.data;
  }

  async createBudgetDivision(division: CreateBudgetDivisionRequest) {
    const response = await this.request('/api/budget/divisions', {
      method: 'POST',
      body: JSON.stringify(division),
    });
    return response.data;
  }

  async updateBudgetDivision(division: UpdateBudgetDivisionRequest) {
    const response = await this.request(`/api/budget/divisions/${division.id}`, {
      method: 'PUT',
      body: JSON.stringify(division),
    });
    return response.data;
  }

  async deleteBudgetDivision(divisionId: string) {
    await this.request(`/api/budget/divisions/${divisionId}`, {
      method: 'DELETE',
    });
  }

  // ========== CATEGORIAS DE ORÇAMENTO ==========
  async getBudgetCategories(divisionId?: string) {
    let endpoint = '/api/budget/categories';
    
    if (divisionId) {
      endpoint += `?division_id=${divisionId}`;
    }

    const response = await this.request(endpoint);
    return response.data;
  }

  async createBudgetCategory(category: CreateBudgetCategoryRequest) {
    const response = await this.request('/api/budget/categories', {
      method: 'POST',
      body: JSON.stringify(category),
    });
    return response.data;
  }

  async updateBudgetCategory(category: UpdateBudgetCategoryRequest) {
    const response = await this.request(`/api/budget/categories/${category.id}`, {
      method: 'PUT',
      body: JSON.stringify(category),
    });
    return response.data;
  }

  async deleteBudgetCategory(categoryId: string) {
    await this.request(`/api/budget/categories/${categoryId}`, {
      method: 'DELETE',
    });
  }
}

// Singleton instance
export const apiService = new ApiService();
export default apiService;
