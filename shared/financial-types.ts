// Tipos para o sistema Capital - Controle Financeiro Pessoal

export type TransactionType = 'receita' | 'despesa';

export type TransactionSource = 'manual' | 'open-finance' | 'importacao';

export type RecurrenceFrequency = 'diario' | 'semanal' | 'mensal' | 'anual';

export type YieldType = 'percentual' | 'fixo';

export interface YieldConfig {
  enabled: boolean;
  type?: YieldType; // 'percentual' (%) ou 'fixo' (R$)
  value?: number; // valor ou percentual
  frequency?: RecurrenceFrequency; // frequência do rendimento
}

export interface RecurrenceConfig {
  enabled: boolean;
  frequency?: RecurrenceFrequency;
  endDate?: string; // ISO date string (opcional)
  times?: number; // número de vezes a repetir (opcional)
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  type: TransactionType;
}

export interface Transaction {
  id: string;
  type: TransactionType;
  category: string;
  categoryName?: string;
  description: string;
  amount: number;
  date: string; // ISO date string
  source: TransactionSource;
  sourceDetails?: {
    bank?: string;
    account?: string;
    card?: string;
    fileName?: string; // Para importações de arquivo
  };
  tags?: string[];
  yieldConfig?: YieldConfig; // Configuração de rendimento (receitas)
  recurrenceConfig?: RecurrenceConfig; // Configuração de recorrência
  createdAt: string;
  updatedAt: string;
}

export interface FinancialAccount {
  id: string;
  name: string;
  type: 'conta-corrente' | 'poupanca' | 'cartao-credito' | 'investimento';
  bank: string;
  balance: number;
  lastSync?: string;
  isActive: boolean;
}

export interface Budget {
  id: string;
  categoryId: string;
  limit: number;
  period: 'mensal' | 'anual';
  spent: number;
  remaining: number;
}

export interface FinancialSummary {
  totalReceitas: number;
  totalDespesas: number;
  saldoAtual: number;
  variacaoMensal: number;
  maioresGastos: Array<{
    category: string;
    amount: number;
    percentage: number;
  }>;
}

export interface FilterOptions {
  startDate?: string;
  endDate?: string;
  type?: TransactionType;
  categories?: string[];
  source?: TransactionSource;
  minAmount?: number;
  maxAmount?: number;
  search?: string;
}

export interface ExportOptions {
  format: 'csv' | 'pdf' | 'json';
  period: {
    start: string;
    end: string;
  };
  includeCategories?: string[];
  groupBy?: 'category' | 'month' | 'day';
}

export interface ImportData {
  transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[];
  fileName: string;
  importedAt: string;
  source: 'pdf' | 'csv' | 'ofx';
}

// Categorias padrão do sistema
export const DEFAULT_CATEGORIES: Category[] = [
  // Receitas
  { id: 'salario', name: 'Salário', type: 'receita', icon: '💼', color: '#10B981' },
  { id: 'freelance', name: 'Freelance', type: 'receita', icon: '💻', color: '#059669' },
  { id: 'investimentos', name: 'Rendimentos', type: 'receita', icon: '📈', color: '#047857' },
  { id: 'outros-receitas', name: 'Outras Receitas', type: 'receita', icon: '💰', color: '#065F46' },
  
  // Despesas
  { id: 'alimentacao', name: 'Alimentação', type: 'despesa', icon: '🍽️', color: '#EF4444' },
  { id: 'transporte', name: 'Transporte', type: 'despesa', icon: '🚗', color: '#DC2626' },
  { id: 'moradia', name: 'Moradia', type: 'despesa', icon: '🏠', color: '#B91C1C' },
  { id: 'saude', name: 'Saúde', type: 'despesa', icon: '⚕️', color: '#991B1B' },
  { id: 'educacao', name: 'Educação', type: 'despesa', icon: '📚', color: '#7F1D1D' },
  { id: 'entretenimento', name: 'Entretenimento', type: 'despesa', icon: '🎬', color: '#F97316' },
  { id: 'compras', name: 'Compras', type: 'despesa', icon: '���️', color: '#EA580C' },
  { id: 'servicos', name: 'Serviços', type: 'despesa', icon: '🔧', color: '#C2410C' },
  { id: 'outros-despesas', name: 'Outras Despesas', type: 'despesa', icon: '📝', color: '#9A3412' },
];

// Tipos para Open Finance (preparação futura)
export interface OpenFinanceConnection {
  id: string;
  bankCode: string;
  bankName: string;
  isConnected: boolean;
  lastSync?: string;
  permissions: string[];
  accessToken?: string;
  refreshToken?: string;
  expiresAt?: string;
}

export interface OpenFinanceTransaction {
  externalId: string;
  amount: number;
  description: string;
  date: string;
  type: 'debit' | 'credit';
  accountId: string;
  merchantName?: string;
  merchantCategory?: string;
}
