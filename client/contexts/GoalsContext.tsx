import React, { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import { Goal, GoalWithStatus, GoalSummary, calculateGoalStatus } from '@shared/goal-types';
import { setObjectCookie, getObjectCookie } from '../utils/cookies';
import apiService from '../services/apiService';
import { useAuth } from './AuthContext';
import type { CreateGoalRequest, UpdateGoalRequest } from '@shared/database-types';

interface GoalsState {
  goals: Goal[];
  summary: GoalSummary;
}

interface GoalsContextType extends GoalsState {
  addGoal: (goal: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => void;
  updateGoal: (goal: Goal) => void;
  deleteGoal: (id: string) => void;
  updateGoalAmount: (id: string, newAmount: number) => void;
  getGoalById: (id: string) => Goal | undefined;
  getGoalsWithStatus: () => GoalWithStatus[];
  getGoalsByCategory: () => Record<string, GoalWithStatus[]>;
}

type GoalsAction =
  | { type: 'ADD_GOAL'; payload: Goal }
  | { type: 'UPDATE_GOAL'; payload: Goal }
  | { type: 'DELETE_GOAL'; payload: string }
  | { type: 'LOAD_GOALS'; payload: Goal[] };

const STORAGE_KEY = 'capital_goals';

function calculateSummary(goals: Goal[]): GoalSummary {
  const goalsWithStatus = goals.map(calculateGoalStatus);
  
  const totalGoals = goals.length;
  const completedGoals = goalsWithStatus.filter(g => g.status === 'concluido').length;
  const inProgressGoals = goalsWithStatus.filter(g => g.status === 'em_andamento').length;
  const overdueGoals = goalsWithStatus.filter(g => g.status === 'atrasado').length;
  
  const totalTargetAmount = goals.reduce((sum, goal) => sum + goal.targetAmount, 0);
  const totalCurrentAmount = goals.reduce((sum, goal) => sum + goal.currentAmount, 0);
  
  const averageProgress = totalGoals > 0 
    ? goalsWithStatus.reduce((sum, goal) => sum + goal.progressPercent, 0) / totalGoals 
    : 0;
  
  return {
    totalGoals,
    completedGoals,
    inProgressGoals,
    overdueGoals,
    totalTargetAmount,
    totalCurrentAmount,
    averageProgress
  };
}

function goalsReducer(state: GoalsState, action: GoalsAction): GoalsState {
  let newGoals: Goal[];
  
  switch (action.type) {
    case 'ADD_GOAL':
      newGoals = [...state.goals, action.payload];
      break;
      
    case 'UPDATE_GOAL':
      newGoals = state.goals.map(goal =>
        goal.id === action.payload.id ? action.payload : goal
      );
      break;
      
    case 'DELETE_GOAL':
      newGoals = state.goals.filter(goal => goal.id !== action.payload);
      break;
      
    case 'LOAD_GOALS':
      return {
        goals: action.payload,
        summary: calculateSummary(action.payload)
      };
      
    default:
      return state;
  }

  // Salvar em cookies
  console.log('Salvando objetivos nos cookies:', newGoals.length, 'items');
  setObjectCookie(STORAGE_KEY, newGoals);
  
  return {
    goals: newGoals,
    summary: calculateSummary(newGoals)
  };
}

const initialState: GoalsState = {
  goals: [],
  summary: {
    totalGoals: 0,
    completedGoals: 0,
    inProgressGoals: 0,
    overdueGoals: 0,
    totalTargetAmount: 0,
    totalCurrentAmount: 0,
    averageProgress: 0
  }
};

const GoalsContext = createContext<GoalsContextType | undefined>(undefined);

export function GoalsProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(goalsReducer, initialState);

  // Carregar objetivos da API quando autenticado; fallback para cookies em demo mode
  const { isAuthenticated, isDemoMode } = useAuth();
  useEffect(() => {
    const load = async () => {
      try {
        if (isAuthenticated) {
          const apiGoals = await apiService.getGoals();
          if (Array.isArray(apiGoals)) {
            const mapped: Goal[] = apiGoals.map((g: any) => ({
              id: g.id,
              name: g.title,
              category: 'outros',
              targetAmount: Number(g.target_amount) || 0,
              currentAmount: Number(g.current_amount) || 0,
              deadline: g.target_date || new Date().toISOString(),
              description: g.description || undefined,
              createdAt: g.created_at,
              updatedAt: g.updated_at
            }));
            dispatch({ type: 'LOAD_GOALS', payload: mapped });
            setObjectCookie(STORAGE_KEY, mapped);
            return;
          }
        }
      } catch (e) {
        console.warn('Falha ao carregar objetivos da API, usando cookies:', e);
      }
      try {
        const goals = getObjectCookie<Goal[]>(STORAGE_KEY);
        if (goals && Array.isArray(goals)) {
          dispatch({ type: 'LOAD_GOALS', payload: goals });
        }
      } catch (error) {
        console.error('Erro ao carregar objetivos dos cookies:', error);
      }
    };
    load();
  }, [isAuthenticated, isDemoMode]);



  const addGoal = useCallback((goalData: Omit<Goal, 'id' | 'createdAt' | 'updatedAt'>) => {
    (async () => {
      try {
        const payload: CreateGoalRequest = {
          title: goalData.name,
          target_amount: goalData.targetAmount,
          target_date: goalData.deadline,
          description: goalData.description,
        } as any;
        const created = await apiService.createGoal(payload as any);
        const goal: Goal = {
          id: created.id,
          name: created.title || goalData.name,
          category: goalData.category,
          targetAmount: Number(created.target_amount) || goalData.targetAmount,
          currentAmount: Number(created.current_amount) || 0,
          deadline: created.target_date || goalData.deadline,
          description: created.description || goalData.description,
          createdAt: created.created_at,
          updatedAt: created.updated_at
        };
        dispatch({ type: 'ADD_GOAL', payload: goal });
      } catch (e) {
        console.warn('Falha ao criar objetivo na API, salvando localmente:', e);
        const local: Goal = {
          ...goalData,
          id: crypto.randomUUID(),
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString()
        };
        dispatch({ type: 'ADD_GOAL', payload: local });
      }
    })();
  }, []);

  const updateGoal = useCallback((goal: Goal) => {
    (async () => {
      try {
        const payload: UpdateGoalRequest = {
          id: goal.id,
          title: goal.name,
          target_amount: goal.targetAmount,
          current_amount: goal.currentAmount,
          target_date: goal.deadline,
          description: goal.description,
          status: undefined,
        } as any;
        await apiService.updateGoal(payload as any);
      } catch (e) {
        console.warn('Falha ao atualizar objetivo na API, atualizando localmente:', e);
      }
      const updatedGoal = {
        ...goal,
        updatedAt: new Date().toISOString()
      };
      dispatch({ type: 'UPDATE_GOAL', payload: updatedGoal });
    })();
  }, []);

  const deleteGoal = useCallback((id: string) => {
    (async () => {
      try {
        await apiService.deleteGoal(id);
      } catch (e) {
        console.warn('Falha ao deletar objetivo na API, removendo localmente:', e);
      }
      dispatch({ type: 'DELETE_GOAL', payload: id });
    })();
  }, []);

  const updateGoalAmount = useCallback((id: string, newAmount: number) => {
    const goal = state.goals.find(g => g.id === id);
    if (goal) {
      updateGoal({
        ...goal,
        currentAmount: newAmount
      });
    }
  }, [state.goals, updateGoal]);

  const getGoalById = useCallback((id: string) => {
    return state.goals.find(goal => goal.id === id);
  }, [state.goals]);

  const getGoalsWithStatus = useCallback(() => {
    return state.goals.map(calculateGoalStatus);
  }, [state.goals]);

  const getGoalsByCategory = useCallback(() => {
    const goalsWithStatus = getGoalsWithStatus();
    return goalsWithStatus.reduce((acc, goal) => {
      if (!acc[goal.category]) {
        acc[goal.category] = [];
      }
      acc[goal.category].push(goal);
      return acc;
    }, {} as Record<string, GoalWithStatus[]>);
  }, [getGoalsWithStatus]);

  const value: GoalsContextType = {
    ...state,
    addGoal,
    updateGoal,
    deleteGoal,
    updateGoalAmount,
    getGoalById,
    getGoalsWithStatus,
    getGoalsByCategory
  };

  return (
    <GoalsContext.Provider value={value}>
      {children}
    </GoalsContext.Provider>
  );
}

export function useGoals() {
  const context = useContext(GoalsContext);
  if (!context) {
    throw new Error('useGoals deve ser usado dentro de GoalsProvider');
  }
  return context;
}
