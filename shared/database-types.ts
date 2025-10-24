// Tipos para API e banco de dados do Capital

export interface User {
  id: string;
  email: string;
  name?: string;
  created_at: string;
  updated_at: string;
}

export interface UserCreate {
  email: string;
  password: string;
  name?: string;
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  success: boolean;
  user?: User;
  token?: string;
  message?: string;
}

// Tabelas do banco com user_id
export interface DBCategory {
  id: string;
  user_id: string;
  name: string;
  icon?: string;
  color?: string;
  type: "receita" | "despesa";
  is_default: boolean;
  created_at: string;
}

export interface DBTransaction {
  id: string;
  user_id: string;
  type: "receita" | "despesa";
  category_id: string;
  description: string;
  amount: number;
  date: string;
  source: "manual" | "open-finance" | "importacao";
  source_details?: string; // JSON
  tags?: string; // JSON array
  is_passive_income?: boolean; // Para receitas passivas
  income_frequency?: "diario" | "semanal" | "mensal" | "anual" | "unico"; // Frequência da renda
  income_amount_type?: "R$" | "%"; // Tipo de valor (fixo em R$ ou percentual)
  created_at: string;
  updated_at: string;
}

export interface DBInvestment {
  id: string;
  user_id: string;
  name: string;
  type: string;
  purchase_date: string;
  purchase_price: number;
  quantity: number;
  current_price?: number;
  broker?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface DBGoal {
  id: string;
  user_id: string;
  title: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  description?: string;
  status: "active" | "completed" | "paused";
  created_at: string;
  updated_at: string;
}

export interface DBGoalAllocation {
  id: string;
  user_id: string;
  goal_id: string;
  transaction_id: string;
  amount: number;
  created_at: string;
}

export interface DBBudgetDivision {
  id: string;
  user_id: string;
  name: string;
  percentage: number;
  color?: string;
  description?: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface DBBudgetCategory {
  id: string;
  user_id: string;
  division_id: string;
  name: string;
  allocated_amount: number;
  spent_amount: number;
  icon?: string;
  color?: string;
  created_at: string;
  updated_at: string;
}

export interface DBBudgetAllocation {
  id: string;
  user_id: string;
  transaction_id: string;
  budget_category_id: string;
  amount: number;
  created_at: string;
}

// Tipos para requisições da API
export interface CreateTransactionRequest {
  type: "receita" | "despesa";
  category_id: string;
  description: string;
  amount: number;
  date: string;
  source?: "manual" | "open-finance" | "importacao";
  source_details?: any;
  tags?: string[];
}

export interface UpdateTransactionRequest
  extends Partial<CreateTransactionRequest> {
  id: string;
}

export interface CreateInvestmentRequest {
  name: string;
  type: string;
  purchase_date: string;
  purchase_price: number;
  quantity: number;
  current_price?: number;
  broker?: string;
  notes?: string;
}

export interface UpdateInvestmentRequest
  extends Partial<CreateInvestmentRequest> {
  id: string;
}

export interface CreateGoalRequest {
  title: string;
  target_amount: number;
  target_date?: string;
  description?: string;
}

export interface UpdateGoalRequest extends Partial<CreateGoalRequest> {
  id: string;
  current_amount?: number;
  status?: "active" | "completed" | "paused";
}

export interface CreateBudgetDivisionRequest {
  name: string;
  percentage: number;
  color?: string;
  description?: string;
  sort_order?: number;
}

export interface UpdateBudgetDivisionRequest
  extends Partial<CreateBudgetDivisionRequest> {
  id: string;
}

export interface CreateBudgetCategoryRequest {
  division_id: string;
  name: string;
  allocated_amount: number;
  icon?: string;
  color?: string;
}

export interface UpdateBudgetCategoryRequest
  extends Partial<CreateBudgetCategoryRequest> {
  id: string;
  spent_amount?: number;
}

export interface CreateBudgetAllocationRequest {
  transaction_id: string;
  budget_category_id: string;
  amount: number;
}

export interface CreateGoalAllocationRequest {
  goal_id: string;
  transaction_id: string;
  amount: number;
}

// Respostas da API
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  pagination?: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

// Configuração de ambiente Cloudflare
export interface CloudflareEnv {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
}

// Contexto de requisição autenticada
export interface AuthenticatedRequest {
  user: User;
}

// Filtros para consultas
export interface TransactionFilters {
  start_date?: string;
  end_date?: string;
  type?: "receita" | "despesa";
  category_id?: string;
  source?: "manual" | "open-finance" | "importacao";
  min_amount?: number;
  max_amount?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export interface InvestmentFilters {
  type?: string;
  broker?: string;
  page?: number;
  limit?: number;
}

export interface GoalFilters {
  status?: "active" | "completed" | "paused";
  page?: number;
  limit?: number;
}
