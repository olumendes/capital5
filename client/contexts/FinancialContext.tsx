import { createContext, useContext, useReducer, useEffect, ReactNode } from 'react';
import {
  Transaction,
  Category,
  FinancialSummary,
  FilterOptions,
  DEFAULT_CATEGORIES,
  TransactionType
} from '@shared/financial-types';
import { DBTransaction, DBCategory } from '@shared/database-types';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';

interface FinancialState {
  transactions: Transaction[];
  categories: Category[];
  summary: FinancialSummary;
  filters: FilterOptions;
  fgtsBalance: number;
  isLoading: boolean;
  error: string | null;
}

type FinancialAction =
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'SET_ERROR'; payload: string | null }
  | { type: 'SET_TRANSACTIONS'; payload: Transaction[] }
  | { type: 'ADD_TRANSACTION'; payload: Transaction }
  | { type: 'UPDATE_TRANSACTION'; payload: Transaction }
  | { type: 'DELETE_TRANSACTION'; payload: string }
  | { type: 'SET_CATEGORIES'; payload: Category[] }
  | { type: 'ADD_CATEGORY'; payload: Category }
  | { type: 'DELETE_CATEGORY'; payload: string }
  | { type: 'SET_FILTERS'; payload: FilterOptions }
  | { type: 'UPDATE_SUMMARY' }
  | { type: 'SET_FGTS_BALANCE'; payload: number }
  | { type: 'ADD_TO_FGTS'; payload: number }
  | { type: 'REMOVE_FROM_FGTS'; payload: number };

const initialState: FinancialState = {
  transactions: [],
  categories: DEFAULT_CATEGORIES,
  summary: {
    totalReceitas: 0,
    totalDespesas: 0,
    saldoAtual: 0,
    variacaoMensal: 0,
    maioresGastos: [],
  },
  filters: {},
  fgtsBalance: 0,
  isLoading: false,
  error: null,
};

function calculateSummary(transactions: Transaction[], categories: Category[]): FinancialSummary {
  const now = new Date();
  const currentMonth = now.getMonth();
  const currentYear = now.getFullYear();
  
  // Transações do mês atual
  const currentMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === currentMonth && 
           transactionDate.getFullYear() === currentYear;
  });

  // Mês anterior para comparação
  const lastMonth = currentMonth === 0 ? 11 : currentMonth - 1;
  const lastMonthYear = currentMonth === 0 ? currentYear - 1 : currentYear;
  
  const lastMonthTransactions = transactions.filter(t => {
    const transactionDate = new Date(t.date);
    return transactionDate.getMonth() === lastMonth && 
           transactionDate.getFullYear() === lastMonthYear;
  });

  const totalReceitas = currentMonthTransactions
    .filter(t => t.type === 'receita')
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDespesas = currentMonthTransactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const lastMonthDespesas = lastMonthTransactions
    .filter(t => t.type === 'despesa')
    .reduce((sum, t) => sum + t.amount, 0);

  const variacaoMensal = lastMonthDespesas > 0 
    ? ((totalDespesas - lastMonthDespesas) / lastMonthDespesas) * 100 
    : 0;

  // Maiores gastos por categoria
  const gastosPorCategoria = new Map<string, number>();
  currentMonthTransactions
    .filter(t => t.type === 'despesa')
    .forEach(t => {
      const current = gastosPorCategoria.get(t.category) || 0;
      gastosPorCategoria.set(t.category, current + t.amount);
    });

  const maioresGastos = Array.from(gastosPorCategoria.entries())
    .map(([categoryId, amount]) => {
      const category = categories.find(c => c.id === categoryId);
      return {
        category: category?.name || categoryId,
        amount,
        percentage: totalDespesas > 0 ? (amount / totalDespesas) * 100 : 0,
      };
    })
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 5);

  return {
    totalReceitas,
    totalDespesas,
    saldoAtual: totalReceitas - totalDespesas,
    variacaoMensal,
    maioresGastos,
  };
}

function financialReducer(state: FinancialState, action: FinancialAction): FinancialState {
  switch (action.type) {
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    
    case 'SET_ERROR':
      return { ...state, error: action.payload, isLoading: false };
    
    case 'SET_TRANSACTIONS':
      const newState = { ...state, transactions: action.payload };
      return { ...newState, summary: calculateSummary(action.payload, state.categories) };
    
    case 'ADD_TRANSACTION':
      const updatedTransactions = [...state.transactions, action.payload];
      return { 
        ...state, 
        transactions: updatedTransactions,
        summary: calculateSummary(updatedTransactions, state.categories)
      };
    
    case 'UPDATE_TRANSACTION':
      const updatedList = state.transactions.map(t => 
        t.id === action.payload.id ? action.payload : t
      );
      return { 
        ...state, 
        transactions: updatedList,
        summary: calculateSummary(updatedList, state.categories)
      };
    
    case 'DELETE_TRANSACTION':
      const filteredTransactions = state.transactions.filter(t => t.id !== action.payload);
      return { 
        ...state, 
        transactions: filteredTransactions,
        summary: calculateSummary(filteredTransactions, state.categories)
      };
    
    case 'SET_CATEGORIES':
      return { ...state, categories: action.payload };
    
    case 'ADD_CATEGORY':
      return { ...state, categories: [...state.categories, action.payload] };

    case 'DELETE_CATEGORY':
      return {
        ...state,
        categories: state.categories.filter(cat => cat.id !== action.payload)
      };

    case 'SET_FILTERS':
      return { ...state, filters: action.payload };
    
    case 'UPDATE_SUMMARY':
      return {
        ...state,
        summary: calculateSummary(state.transactions, state.categories)
      };

    case 'SET_FGTS_BALANCE':
      return { ...state, fgtsBalance: action.payload };

    case 'ADD_TO_FGTS':
      return { ...state, fgtsBalance: state.fgtsBalance + action.payload };

    case 'REMOVE_FROM_FGTS':
      return { ...state, fgtsBalance: Math.max(0, state.fgtsBalance - action.payload) };

    default:
      return state;
  }
}

interface FinancialContextType extends FinancialState {
  addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateTransaction: (transaction: Transaction) => void;
  deleteTransaction: (id: string) => void;
  addCategory: (category: Omit<Category, 'id'>) => void;
  deleteCategory: (id: string) => boolean;
  setFilters: (filters: FilterOptions) => void;
  getFilteredTransactions: () => Transaction[];
  loadTransactions: () => Promise<void>;
  saveTransactions: () => Promise<void>;
  setFGTSBalance: (amount: number) => void;
  addToFGTSBalance: (amount: number) => void;
  removeFromFGTSBalance: (amount: number) => void;
}

const FinancialContext = createContext<FinancialContextType | undefined>(undefined);

export function useFinancial() {
  const context = useContext(FinancialContext);
  if (context === undefined) {
    throw new Error('useFinancial must be used within a FinancialProvider');
  }
  return context;
}

interface FinancialProviderProps {
  children: ReactNode;
}

const DEMO_STORAGE_KEY = 'capital_financial_demo';
const DEMO_FGTS_KEY = 'capital_fgts_demo';

export function FinancialProvider({ children }: FinancialProviderProps) {
  const [state, dispatch] = useReducer(financialReducer, initialState);
  const { isAuthenticated, user, isDemoMode } = useAuth();

  // Carregar dados da API quando autenticado ou do localStorage em modo demo
  useEffect(() => {
    if (isAuthenticated && user) {
      loadTransactions();
    } else if (isDemoMode) {
      loadDemoData();
    } else {
      // Limpar dados quando não autenticado e não em modo demo
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES });
      dispatch({ type: 'SET_FGTS_BALANCE', payload: 0 });
    }
  }, [isAuthenticated, user, isDemoMode]);

  const addTransaction = async (transactionData: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => {
    if (!isAuthenticated && !isDemoMode) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      let transaction: Transaction;

      if (isDemoMode) {
        transaction = {
          ...transactionData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
        saveDemoData();
      } else {
        const dbTransaction = await apiService.createTransaction({
          type: transactionData.type,
          category_id: transactionData.category,
          description: transactionData.description,
          amount: transactionData.amount,
          date: transactionData.date,
          source: transactionData.source,
          source_details: transactionData.sourceDetails,
          tags: transactionData.tags
        });

        // Converter de volta para o formato local
        transaction = {
          id: dbTransaction.id,
          type: dbTransaction.type,
          category: dbTransaction.category_id,
          categoryName: transactionData.categoryName,
          description: dbTransaction.description,
          amount: dbTransaction.amount,
          date: dbTransaction.date,
          source: dbTransaction.source,
          sourceDetails: dbTransaction.source_details ? JSON.parse(dbTransaction.source_details) : undefined,
          tags: dbTransaction.tags ? JSON.parse(dbTransaction.tags) : undefined,
          createdAt: dbTransaction.created_at,
          updatedAt: dbTransaction.updated_at
        };
        dispatch({ type: 'ADD_TRANSACTION', payload: transaction });
      }
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar transação';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const updateTransaction = async (transaction: Transaction) => {
    if (!isAuthenticated && !isDemoMode) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const updatedTransaction = {
        ...transaction,
        updatedAt: new Date().toISOString(),
      };

      if (isDemoMode) {
        dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
        saveDemoData();
      } else {
        await apiService.updateTransaction({
          id: transaction.id,
          type: transaction.type,
          category_id: transaction.category,
          description: transaction.description,
          amount: transaction.amount,
          date: transaction.date,
          source: transaction.source,
          source_details: transaction.sourceDetails,
          tags: transaction.tags
        });
        dispatch({ type: 'UPDATE_TRANSACTION', payload: updatedTransaction });
      }
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao atualizar transação';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteTransaction = async (id: string) => {
    if (!isAuthenticated && !isDemoMode) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      if (isDemoMode) {
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
        saveDemoData();
      } else {
        await apiService.deleteTransaction(id);
        dispatch({ type: 'DELETE_TRANSACTION', payload: id });
      }
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar transação';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const addCategory = async (categoryData: Omit<Category, 'id'>) => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return;
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const dbCategory = await apiService.createCategory({
        name: categoryData.name,
        icon: categoryData.icon,
        color: categoryData.color,
        type: categoryData.type,
        is_default: false
      });

      const category: Category = {
        id: dbCategory.id,
        name: dbCategory.name,
        icon: dbCategory.icon,
        color: dbCategory.color,
        type: dbCategory.type
      };

      dispatch({ type: 'ADD_CATEGORY', payload: category });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao adicionar categoria';
      dispatch({ type: 'SET_ERROR', payload: message });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const deleteCategory = async (id: string): Promise<boolean> => {
    if (!isAuthenticated) {
      dispatch({ type: 'SET_ERROR', payload: 'Usuário não autenticado' });
      return false;
    }

    // Verificar se a categoria está sendo usada em alguma transação
    const isUsed = state.transactions.some(transaction => transaction.category === id);
    if (isUsed) {
      return false; // Não pode deletar categoria que está em uso
    }

    // Verificar se é uma categoria padrão
    const isDefaultCategory = DEFAULT_CATEGORIES.some(cat => cat.id === id);
    if (isDefaultCategory) {
      return false; // Não pode deletar categorias padrão
    }

    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      await apiService.deleteCategory(id);
      dispatch({ type: 'DELETE_CATEGORY', payload: id });
      dispatch({ type: 'SET_ERROR', payload: null });
      return true;
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Erro ao deletar categoria';
      dispatch({ type: 'SET_ERROR', payload: message });
      return false;
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const setFilters = (filters: FilterOptions) => {
    dispatch({ type: 'SET_FILTERS', payload: filters });
  };

  const getFilteredTransactions = (): Transaction[] => {
    let filtered = [...state.transactions];

    if (state.filters.startDate) {
      filtered = filtered.filter(t => t.date >= state.filters.startDate!);
    }

    if (state.filters.endDate) {
      filtered = filtered.filter(t => t.date <= state.filters.endDate!);
    }

    if (state.filters.type) {
      filtered = filtered.filter(t => t.type === state.filters.type);
    }

    if (state.filters.categories && state.filters.categories.length > 0) {
      filtered = filtered.filter(t => state.filters.categories!.includes(t.category));
    }

    if (state.filters.source) {
      filtered = filtered.filter(t => t.source === state.filters.source);
    }

    if (state.filters.minAmount !== undefined) {
      filtered = filtered.filter(t => t.amount >= state.filters.minAmount!);
    }

    if (state.filters.maxAmount !== undefined) {
      filtered = filtered.filter(t => t.amount <= state.filters.maxAmount!);
    }

    if (state.filters.search) {
      const search = state.filters.search.toLowerCase();
      filtered = filtered.filter(t => 
        t.description.toLowerCase().includes(search) ||
        t.categoryName?.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  };

  const loadTransactions = async () => {
    if (!isAuthenticated) {
      return;
    }

    try {
      dispatch({ type: 'SET_LOADING', payload: true });

      // Carregar transações e categorias da API
      const [dbTransactions, dbCategories] = await Promise.all([
        apiService.getTransactions(),
        apiService.getCategories()
      ]);

      // Converter transações do formato DB para o formato local
      const transactions: Transaction[] = dbTransactions.map((dbTx: DBTransaction) => ({
        id: dbTx.id,
        type: dbTx.type,
        category: dbTx.category_id,
        categoryName: dbCategories.find((cat: DBCategory) => cat.id === dbTx.category_id)?.name,
        description: dbTx.description,
        amount: dbTx.amount,
        date: dbTx.date,
        source: dbTx.source,
        sourceDetails: dbTx.source_details ? JSON.parse(dbTx.source_details) : undefined,
        tags: dbTx.tags ? JSON.parse(dbTx.tags) : undefined,
        createdAt: dbTx.created_at,
        updatedAt: dbTx.updated_at
      }));

      // Converter categorias do formato DB para o formato local
      const categories: Category[] = dbCategories.map((dbCat: DBCategory) => ({
        id: dbCat.id,
        name: dbCat.name,
        icon: dbCat.icon,
        color: dbCat.color,
        type: dbCat.type
      }));

      dispatch({ type: 'SET_TRANSACTIONS', payload: transactions });
      dispatch({ type: 'SET_CATEGORIES', payload: categories });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Erro ao carregar dados:', error);
      dispatch({ type: 'SET_ERROR', payload: 'Erro ao carregar dados' });
    } finally {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  const loadDemoData = async () => {
    try {
      const savedTransactions = localStorage.getItem(DEMO_STORAGE_KEY);
      const savedFGTS = localStorage.getItem(DEMO_FGTS_KEY);

      if (savedTransactions) {
        dispatch({ type: 'SET_TRANSACTIONS', payload: JSON.parse(savedTransactions) });
      } else {
        dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      }

      if (savedFGTS) {
        dispatch({ type: 'SET_FGTS_BALANCE', payload: parseFloat(savedFGTS) });
      }

      dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES });
      dispatch({ type: 'SET_ERROR', payload: null });
    } catch (error) {
      console.error('Erro ao carregar dados de demo:', error);
      dispatch({ type: 'SET_TRANSACTIONS', payload: [] });
      dispatch({ type: 'SET_CATEGORIES', payload: DEFAULT_CATEGORIES });
    }
  };

  const saveDemoData = () => {
    try {
      localStorage.setItem(DEMO_STORAGE_KEY, JSON.stringify(state.transactions));
      localStorage.setItem(DEMO_FGTS_KEY, state.fgtsBalance.toString());
    } catch (error) {
      console.error('Erro ao salvar dados de demo:', error);
    }
  };

  const saveTransactions = async () => {
    if (isDemoMode) {
      saveDemoData();
    }
    return Promise.resolve();
  };

  const setFGTSBalance = (amount: number) => {
    dispatch({ type: 'SET_FGTS_BALANCE', payload: Math.max(0, amount) });
    if (isDemoMode) {
      localStorage.setItem(DEMO_FGTS_KEY, amount.toString());
    }
  };

  const addToFGTSBalance = (amount: number) => {
    dispatch({ type: 'ADD_TO_FGTS', payload: amount });
    const newBalance = state.fgtsBalance + amount;
    if (isDemoMode) {
      localStorage.setItem(DEMO_FGTS_KEY, newBalance.toString());
    }
  };

  const removeFromFGTSBalance = (amount: number) => {
    const newBalance = Math.max(0, state.fgtsBalance - amount);
    dispatch({ type: 'REMOVE_FROM_FGTS', payload: amount });
    if (isDemoMode) {
      localStorage.setItem(DEMO_FGTS_KEY, newBalance.toString());
    }
  };

  const contextValue: FinancialContextType = {
    ...state,
    addTransaction,
    updateTransaction,
    deleteTransaction,
    addCategory,
    deleteCategory,
    setFilters,
    getFilteredTransactions,
    loadTransactions,
    saveTransactions,
    setFGTSBalance,
    addToFGTSBalance,
    removeFromFGTSBalance,
  };

  return (
    <FinancialContext.Provider value={contextValue}>
      {children}
    </FinancialContext.Provider>
  );
}
