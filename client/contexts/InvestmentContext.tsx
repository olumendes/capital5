import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Investment, InvestmentType, InvestmentSummary, QuoteResponse, GoalAllocation } from '@shared/investment-types';
import { quoteService } from '../services/quoteService';
import { setObjectCookie, getObjectCookie } from '../utils/cookies';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import type { CreateInvestmentRequest, UpdateInvestmentRequest } from '@shared/database-types';

interface InvestmentState {
  investments: Investment[];
  quotes: Record<InvestmentType, QuoteResponse>;
  summary: InvestmentSummary;
  isUpdatingQuotes: boolean;
  lastQuoteUpdate?: string;
}

interface InvestmentContextType extends InvestmentState {
  addInvestment: (investment: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateInvestment: (investment: Investment) => void;
  deleteInvestment: (id: string) => void;
  updateQuotes: () => Promise<void>;
  calculateInvestmentValue: (investment: Investment) => number;
  getInvestmentById: (id: string) => Investment | undefined;
  allocateToGoal: (amount: number, goalId: string, goalName: string) => boolean;
  getTotalAllocatedToGoals: () => number;
  getAllocationsForGoal: (goalId: string) => { investment: Investment; allocation: GoalAllocation }[];
  removeGoalAllocation: (goalId: string) => void;
}

type InvestmentAction =
  | { type: 'ADD_INVESTMENT'; payload: Investment }
  | { type: 'UPDATE_INVESTMENT'; payload: Investment }
  | { type: 'DELETE_INVESTMENT'; payload: string }
  | { type: 'SET_QUOTES'; payload: Record<InvestmentType, QuoteResponse> }
  | { type: 'SET_UPDATING_QUOTES'; payload: boolean }
  | { type: 'LOAD_INVESTMENTS'; payload: Investment[] }
  | { type: 'ALLOCATE_TO_GOAL'; payload: { amount: number; goalId: string; goalName: string } }
  | { type: 'REMOVE_GOAL_ALLOCATION'; payload: string };

const STORAGE_KEY = 'capital_investments';

function getTotalAllocatedForInvestment(investment: Investment): number {
  return investment.goalAllocations?.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0) || 0;
}

function calculateSummary(investments: Investment[]): InvestmentSummary {
  const totalInvested = investments.reduce((sum, inv) => sum + (inv.quantity * inv.purchasePrice), 0);
  const currentValue = investments.reduce((sum, inv) => {
    // Use currentValue if available, otherwise fallback to invested amount
    const value = inv.currentValue || (inv.quantity * inv.purchasePrice);
    return sum + value;
  }, 0);
  const totalProfitLoss = currentValue - totalInvested;
  const totalProfitLossPercent = totalInvested > 0 ? (totalProfitLoss / totalInvested) * 100 : 0;



  const bestPerformer = investments
    .filter(inv => inv.profitLossPercent !== undefined)
    .sort((a, b) => (b.profitLossPercent || 0) - (a.profitLossPercent || 0))[0];

  const worstPerformer = investments
    .filter(inv => inv.profitLossPercent !== undefined)
    .sort((a, b) => (a.profitLossPercent || 0) - (b.profitLossPercent || 0))[0];

  return {
    totalInvested,
    currentValue,
    totalProfitLoss,
    totalProfitLossPercent,
    bestPerformer,
    worstPerformer
  };
}

function updateInvestmentValues(investments: Investment[], quotes: Record<InvestmentType, QuoteResponse>): Investment[] {
  return investments.map(investment => {
    const quote = quotes[investment.type];

    // Se não há cotação, manter valores existentes ou usar preço de compra
    if (!quote) {
      const fallbackValue = investment.currentValue || (investment.quantity * investment.purchasePrice);
      return {
        ...investment,
        currentValue: fallbackValue,
        currentPrice: investment.currentPrice || investment.purchasePrice
      };
    }

    const currentPrice = quote.price;
    const currentValue = investment.quantity * currentPrice;
    const totalInvested = investment.quantity * investment.purchasePrice;
    const profitLoss = currentValue - totalInvested;
    const profitLossPercent = totalInvested > 0 ? (profitLoss / totalInvested) * 100 : 0;

    return {
      ...investment,
      currentPrice,
      currentValue,
      profitLoss,
      profitLossPercent,
      updatedAt: new Date().toISOString()
    };
  });
}

function investmentReducer(state: InvestmentState, action: InvestmentAction): InvestmentState {
  let newInvestments: Investment[];
  
  switch (action.type) {
    case 'ADD_INVESTMENT':
      newInvestments = [...state.investments, action.payload];
      // Salvar em cookies
      console.log('Salvando novo investimento nos cookies:', newInvestments.length, 'items');
      setObjectCookie(STORAGE_KEY, newInvestments);
      return {
        ...state,
        investments: newInvestments,
        summary: calculateSummary(newInvestments)
      };
      
    case 'UPDATE_INVESTMENT':
      newInvestments = state.investments.map(inv =>
        inv.id === action.payload.id ? action.payload : inv
      );
      // Salvar em cookies
      console.log('Salvando investimento atualizado nos cookies:', newInvestments.length, 'items');
      setObjectCookie(STORAGE_KEY, newInvestments);
      return {
        ...state,
        investments: newInvestments,
        summary: calculateSummary(newInvestments)
      };
      
    case 'DELETE_INVESTMENT':
      newInvestments = state.investments.filter(inv => inv.id !== action.payload);
      // Salvar em cookies
      console.log('Salvando após deletar investimento nos cookies:', newInvestments.length, 'items');
      setObjectCookie(STORAGE_KEY, newInvestments);
      return {
        ...state,
        investments: newInvestments,
        summary: calculateSummary(newInvestments)
      };
      
    case 'LOAD_INVESTMENTS':
      return {
        ...state,
        investments: action.payload,
        summary: calculateSummary(action.payload)
      };
      
    case 'SET_QUOTES':
      const updatedInvestments = updateInvestmentValues(state.investments, action.payload);
      // Salvar em cookies
      console.log('Salvando investimentos atualizados nos cookies:', updatedInvestments.length, 'items');
      setObjectCookie(STORAGE_KEY, updatedInvestments);
      
      return {
        ...state,
        investments: updatedInvestments,
        quotes: action.payload,
        summary: calculateSummary(updatedInvestments),
        lastQuoteUpdate: new Date().toISOString()
      };
      
    case 'SET_UPDATING_QUOTES':
      return {
        ...state,
        isUpdatingQuotes: action.payload
      };

    case 'ALLOCATE_TO_GOAL':
      const { amount, goalId, goalName } = action.payload;
      let remainingAmount = amount;
      const allocatedInvestments = state.investments.map(investment => {
        if (remainingAmount <= 0) return investment;

        // Usar currentValue se disponível, senão calcular baseado na quantidade * preço de compra
        const investmentValue = investment.currentValue || (investment.quantity * investment.purchasePrice) || 0;
        const availableValue = investmentValue - getTotalAllocatedForInvestment(investment);

        if (availableValue <= 0) return investment;

        const allocationAmount = Math.min(remainingAmount, availableValue);
        remainingAmount -= allocationAmount;

        const newAllocation: GoalAllocation = {
          goalId,
          goalName,
          allocatedAmount: allocationAmount,
          allocatedAt: new Date().toISOString()
        };

        return {
          ...investment,
          goalAllocations: [...(investment.goalAllocations || []), newAllocation],
          updatedAt: new Date().toISOString()
        };
      });

      // Salvar em cookies
      console.log('Salvando alocações nos cookies:', allocatedInvestments.length, 'items');
      setObjectCookie(STORAGE_KEY, allocatedInvestments);

      return {
        ...state,
        investments: allocatedInvestments,
        summary: calculateSummary(allocatedInvestments)
      };

    case 'REMOVE_GOAL_ALLOCATION':
      const filteredInvestments = state.investments.map(investment => ({
        ...investment,
        goalAllocations: investment.goalAllocations?.filter(alloc => alloc.goalId !== action.payload) || []
      }));

      // Salvar em cookies
      console.log('Salvando filtros nos cookies:', filteredInvestments.length, 'items');
      setObjectCookie(STORAGE_KEY, filteredInvestments);

      return {
        ...state,
        investments: filteredInvestments,
        summary: calculateSummary(filteredInvestments)
      };

    default:
      return state;
  }
}

const initialState: InvestmentState = {
  investments: [],
  quotes: {} as Record<InvestmentType, QuoteResponse>,
  summary: {
    totalInvested: 0,
    currentValue: 0,
    totalProfitLoss: 0,
    totalProfitLossPercent: 0
  },
  isUpdatingQuotes: false
};

const InvestmentContext = createContext<InvestmentContextType | undefined>(undefined);

export function InvestmentProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(investmentReducer, initialState);

  // Carregar investimentos da API quando autenticado; fallback para cookies
  const { isAuthenticated } = useAuth();
  useEffect(() => {
    const load = async () => {
      try {
        if (isAuthenticated) {
          const apiItems = await apiService.getInvestments();
          if (Array.isArray(apiItems)) {
            const mapped: Investment[] = apiItems.map((it: any) => ({
              id: it.id,
              type: (it.type || 'bitcoin') as InvestmentType,
              name: it.name || '',
              quantity: Number(it.quantity) || 0,
              purchasePrice: Number(it.purchase_price) || 0,
              purchaseDate: it.purchase_date,
              currentPrice: it.current_price ?? undefined,
              currentValue: it.current_price ? Number(it.current_price) * (Number(it.quantity) || 0) : undefined,
              createdAt: it.created_at,
              updatedAt: it.updated_at,
            }));
            dispatch({ type: 'LOAD_INVESTMENTS', payload: mapped });
            setObjectCookie(STORAGE_KEY, mapped);
            return;
          }
        }
      } catch (e) {
        console.warn('Falha ao carregar investimentos da API, usando cookies:', e);
      }
      try {
        const investments = getObjectCookie<Investment[]>(STORAGE_KEY);
        if (investments && Array.isArray(investments)) {
          dispatch({ type: 'LOAD_INVESTMENTS', payload: investments });
        }
      } catch (error) {
        console.error('Erro ao carregar investimentos dos cookies:', error);
      }
    };
    load();
  }, [isAuthenticated]);



  // Atualizar cotações automaticamente a cada 5 minutos
  useEffect(() => {
    const interval = setInterval(() => {
      if (state.investments.length > 0) {
        updateQuotes();
      }
    }, 5 * 60 * 1000); // 5 minutos

    return () => clearInterval(interval);
  }, [state.investments.length]);

  const addInvestment = useCallback((investmentData: Omit<Investment, 'id' | 'createdAt' | 'updatedAt'>) => {
    (async () => {
      try {
        const payload: CreateInvestmentRequest = {
          name: investmentData.name,
          type: investmentData.type,
          purchase_date: investmentData.purchaseDate,
          purchase_price: investmentData.purchasePrice,
          quantity: investmentData.quantity,
        };
        const created = await apiService.createInvestment(payload);
        const investment: Investment = {
          id: created.id,
          type: created.type as InvestmentType,
          name: created.name || investmentData.name,
          quantity: Number(created.quantity) || investmentData.quantity,
          purchasePrice: Number(created.purchase_price) || investmentData.purchasePrice,
          purchaseDate: created.purchase_date || investmentData.purchaseDate,
          currentPrice: created.current_price ?? undefined,
          currentValue: created.current_price ? Number(created.current_price) * (Number(created.quantity) || 0) : undefined,
          createdAt: created.created_at,
          updatedAt: created.updated_at,
        };
        dispatch({ type: 'ADD_INVESTMENT', payload: investment });
      } catch (e) {
        console.warn('Falha ao criar investimento na API, salvando localmente:', e);
        const local: Investment = {
          ...investmentData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dispatch({ type: 'ADD_INVESTMENT', payload: local });
      }
    })();
  }, []);

  const updateInvestment = useCallback((investment: Investment) => {
    (async () => {
      try {
        const payload: UpdateInvestmentRequest = {
          id: investment.id,
          name: investment.name,
          type: investment.type,
          purchase_date: investment.purchaseDate,
          purchase_price: investment.purchasePrice,
          quantity: investment.quantity,
          current_price: investment.currentPrice,
        } as any;
        await apiService.updateInvestment(payload as any);
      } catch (e) {
        console.warn('Falha ao atualizar investimento na API, atualizando localmente:', e);
      }
      const updatedInvestment = {
        ...investment,
        updatedAt: new Date().toISOString()
      };
      dispatch({ type: 'UPDATE_INVESTMENT', payload: updatedInvestment });
    })();
  }, []);

  const deleteInvestment = useCallback((id: string) => {
    (async () => {
      try {
        await apiService.deleteInvestment(id);
      } catch (e) {
        console.warn('Falha ao deletar investimento na API, removendo localmente:', e);
      }
      dispatch({ type: 'DELETE_INVESTMENT', payload: id });
    })();
  }, []);

  const updateQuotes = useCallback(async () => {
    if (state.investments.length === 0) return;

    dispatch({ type: 'SET_UPDATING_QUOTES', payload: true });

    try {
      const investmentTypes = [...new Set(state.investments.map(inv => inv.type))];
      const quotes = await quoteService.getMultipleQuotes(investmentTypes);
      dispatch({ type: 'SET_QUOTES', payload: quotes });
    } catch (error) {
      console.error('Erro ao atualizar cotações:', error);
    } finally {
      dispatch({ type: 'SET_UPDATING_QUOTES', payload: false });
    }
  }, [state.investments]);

  const calculateInvestmentValue = useCallback((investment: Investment): number => {
    return investment.currentValue || (investment.quantity * investment.purchasePrice);
  }, []);

  const getInvestmentById = useCallback((id: string) => {
    return state.investments.find(inv => inv.id === id);
  }, [state.investments]);

  const allocateToGoal = useCallback((amount: number, goalId: string, goalName: string): boolean => {
    if (state.investments.length === 0) {
      return false;
    }

    const totalAvailable = state.investments.reduce((sum, inv) => {
      // Usar currentValue se disponível, senão calcular baseado na quantidade * preço de compra
      const invValue = inv.currentValue || (inv.quantity * inv.purchasePrice) || 0;
      const allocated = getTotalAllocatedForInvestment(inv);
      const available = Math.max(0, invValue - allocated);
      return sum + available;
    }, 0);

    if (amount > totalAvailable) {
      return false; // Não há valor suficiente para alocar
    }

    dispatch({ type: 'ALLOCATE_TO_GOAL', payload: { amount, goalId, goalName } });
    return true;
  }, [state.investments]);

  const getTotalAllocatedToGoals = useCallback(() => {
    return state.investments.reduce((sum, inv) => {
      return sum + getTotalAllocatedForInvestment(inv);
    }, 0);
  }, [state.investments]);

  const getAllocationsForGoal = useCallback((goalId: string) => {
    const allocations: { investment: Investment; allocation: GoalAllocation }[] = [];

    state.investments.forEach(investment => {
      investment.goalAllocations?.forEach(allocation => {
        if (allocation.goalId === goalId) {
          allocations.push({ investment, allocation });
        }
      });
    });

    return allocations;
  }, [state.investments]);

  const removeGoalAllocation = useCallback((goalId: string) => {
    dispatch({ type: 'REMOVE_GOAL_ALLOCATION', payload: goalId });
  }, []);

  // Atualizar cotações na primeira carga se houver investimentos
  useEffect(() => {
    if (state.investments.length > 0 && Object.keys(state.quotes).length === 0) {
      updateQuotes();
    }
  }, [state.investments.length, updateQuotes, state.quotes]);

  const value: InvestmentContextType = {
    ...state,
    addInvestment,
    updateInvestment,
    deleteInvestment,
    updateQuotes,
    calculateInvestmentValue,
    getInvestmentById,
    allocateToGoal,
    getTotalAllocatedToGoals,
    getAllocationsForGoal,
    removeGoalAllocation
  };

  return (
    <InvestmentContext.Provider value={value}>
      {children}
    </InvestmentContext.Provider>
  );
}

export function useInvestments() {
  const context = useContext(InvestmentContext);
  if (!context) {
    throw new Error('useInvestments deve ser usado dentro de InvestmentProvider');
  }
  return context;
}
