// Tipos para objetivos financeiros
export type GoalCategory = 
  | 'viagem' 
  | 'emergencia' 
  | 'carro' 
  | 'imovel' 
  | 'educacao' 
  | 'saude' 
  | 'aposentadoria' 
  | 'wedding' 
  | 'tecnologia' 
  | 'outros';

export type GoalStatus = 'em_andamento' | 'concluido' | 'atrasado';

export interface Goal {
  id: string;
  name: string;
  category: GoalCategory;
  targetAmount: number;
  currentAmount: number;
  deadline: string; // ISO date string
  description?: string;
  createdAt: string;
  updatedAt: string;
}

export interface GoalWithStatus extends Goal {
  status: GoalStatus;
  progressPercent: number;
  remainingAmount: number;
  daysRemaining: number;
  isOverdue: boolean;
  monthsRemaining: number;
  monthlySavingsNeeded: number;
}

export interface GoalCategoryOption {
  id: GoalCategory;
  name: string;
  description: string;
  icon: string;
  color: string;
}

export interface GoalSummary {
  totalGoals: number;
  completedGoals: number;
  inProgressGoals: number;
  overdueGoals: number;
  totalTargetAmount: number;
  totalCurrentAmount: number;
  averageProgress: number;
}

// Categorias de objetivos disponíveis
export const GOAL_CATEGORIES: GoalCategoryOption[] = [
  {
    id: 'viagem',
    name: 'Viagem',
    description: 'Viagens e turismo',
    icon: '✈️',
    color: '#3B82F6'
  },
  {
    id: 'emergencia',
    name: 'Emergência',
    description: 'Reserva de emergência',
    icon: '🆘',
    color: '#EF4444'
  },
  {
    id: 'carro',
    name: 'Carro',
    description: 'Veículo próprio',
    icon: '🚗',
    color: '#8B5CF6'
  },
  {
    id: 'imovel',
    name: 'Imóvel',
    description: 'Casa própria ou investimento',
    icon: '🏠',
    color: '#10B981'
  },
  {
    id: 'educacao',
    name: 'Educação',
    description: 'Cursos e formação',
    icon: '📚',
    color: '#F59E0B'
  },
  {
    id: 'saude',
    name: 'Saúde',
    description: 'Tratamentos e bem-estar',
    icon: '⚕️',
    color: '#EC4899'
  },
  {
    id: 'aposentadoria',
    name: 'Aposentadoria',
    description: 'Reserva para o futuro',
    icon: '🏖️',
    color: '#6366F1'
  },
  {
    id: 'wedding',
    name: 'Casamento',
    description: 'Cerimônia e lua de mel',
    icon: '💒',
    color: '#F97316'
  },
  {
    id: 'tecnologia',
    name: 'Tecnologia',
    description: 'Gadgets e equipamentos',
    icon: '💻',
    color: '#06B6D4'
  },
  {
    id: 'outros',
    name: 'Outros',
    description: 'Outros objetivos',
    icon: '🎯',
    color: '#64748B'
  }
];

export function getGoalCategory(id: GoalCategory): GoalCategoryOption | undefined {
  return GOAL_CATEGORIES.find(category => category.id === id);
}

export function calculateGoalStatus(goal: Goal): GoalWithStatus {
  const progressPercent = goal.targetAmount > 0 ? (goal.currentAmount / goal.targetAmount) * 100 : 0;
  const remainingAmount = Math.max(0, goal.targetAmount - goal.currentAmount);

  const deadlineDate = new Date(goal.deadline);
  const today = new Date();
  const timeDiff = deadlineDate.getTime() - today.getTime();
  const daysRemaining = Math.ceil(timeDiff / (1000 * 3600 * 24));
  const isOverdue = daysRemaining < 0;

  // Calcular meses restantes e valor mensal necessário
  const monthsRemaining = Math.max(1, Math.ceil(daysRemaining / 30));
  const monthlySavingsNeeded = remainingAmount > 0 ? remainingAmount / monthsRemaining : 0;

  let status: GoalStatus;
  if (progressPercent >= 100) {
    status = 'concluido';
  } else if (isOverdue) {
    status = 'atrasado';
  } else {
    status = 'em_andamento';
  }

  return {
    ...goal,
    status,
    progressPercent: Math.min(100, progressPercent),
    remainingAmount,
    daysRemaining,
    isOverdue,
    monthsRemaining,
    monthlySavingsNeeded
  };
}
