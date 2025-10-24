export interface BudgetCategory {
  id: string;
  name: string;
  monthlyLimit: number;
  description?: string;
  icon?: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface BudgetExpense {
  id: string;
  categoryId: string;
  amount: number;
  description: string;
  date: string;
  transactionId?: string; // Reference to transaction if linked
}

export interface CategoryBudgetStatus {
  category: BudgetCategory;
  monthlyLimit: number;
  currentSpent: number;
  remainingBudget: number;
  percentUsed: number;
  status: 'ok' | 'warning' | 'exceeded';
  expenses: BudgetExpense[];
}

export interface BudgetSummary {
  totalBudget: number;
  totalSpent: number;
  totalRemaining: number;
  percentUsed: number;
  categoriesCount: number;
  categoriesOk: number;
  categoriesWarning: number;
  categoriesExceeded: number;
}

export const DEFAULT_BUDGET_CATEGORIES = [
  {
    name: 'Gastos Fixos',
    icon: '🏠',
    color: '#ef4444',
    description: 'Aluguel, condomínio, financiamentos, etc.'
  },
  {
    name: 'Alimentação',
    icon: '🍽️',
    color: '#f59e0b',
    description: 'Supermercado, restaurantes, delivery'
  },
  {
    name: 'Transporte',
    icon: '🚗',
    color: '#3b82f6',
    description: 'Combustível, transporte público, manutenção'
  },
  {
    name: 'Lazer',
    icon: '🎮',
    color: '#8b5cf6',
    description: 'Cinema, jogos, viagens, entretenimento'
  },
  {
    name: 'Educação',
    icon: '📚',
    color: '#06b6d4',
    description: 'Cursos, livros, materiais educativos'
  },
  {
    name: 'Saúde',
    icon: '⚕️',
    color: '#10b981',
    description: 'Plano de saúde, medicamentos, consultas'
  },
  {
    name: 'Emergência',
    icon: '🚨',
    color: '#dc2626',
    description: 'Gastos inesperados e emergenciais'
  },
  {
    name: 'Investimentos',
    icon: '💰',
    color: '#059669',
    description: 'Aplicações, poupança, ações'
  }
];

export function calculateCategoryStatus(
  category: BudgetCategory,
  expenses: BudgetExpense[]
): CategoryBudgetStatus {
  const currentSpent = expenses
    .filter(expense => expense.categoryId === category.id)
    .reduce((sum, expense) => sum + expense.amount, 0);

  const remainingBudget = category.monthlyLimit - currentSpent;
  const percentUsed = category.monthlyLimit > 0 ? (currentSpent / category.monthlyLimit) * 100 : 0;

  let status: 'ok' | 'warning' | 'exceeded' = 'ok';
  if (percentUsed >= 100) {
    status = 'exceeded';
  } else if (percentUsed >= 80) {
    status = 'warning';
  }

  return {
    category,
    monthlyLimit: category.monthlyLimit,
    currentSpent,
    remainingBudget,
    percentUsed,
    status,
    expenses: expenses.filter(expense => expense.categoryId === category.id)
  };
}

export function calculateBudgetSummary(
  categories: BudgetCategory[],
  expenses: BudgetExpense[]
): BudgetSummary {
  const totalBudget = categories.reduce((sum, cat) => sum + cat.monthlyLimit, 0);
  const totalSpent = expenses.reduce((sum, exp) => sum + exp.amount, 0);
  const totalRemaining = totalBudget - totalSpent;
  const percentUsed = totalBudget > 0 ? (totalSpent / totalBudget) * 100 : 0;

  const categoryStatuses = categories.map(cat => calculateCategoryStatus(cat, expenses));
  
  return {
    totalBudget,
    totalSpent,
    totalRemaining,
    percentUsed,
    categoriesCount: categories.length,
    categoriesOk: categoryStatuses.filter(s => s.status === 'ok').length,
    categoriesWarning: categoryStatuses.filter(s => s.status === 'warning').length,
    categoriesExceeded: categoryStatuses.filter(s => s.status === 'exceeded').length
  };
}
