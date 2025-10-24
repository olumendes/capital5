import {
  DBTransaction,
  DBCategory,
  DBInvestment,
  DBGoal,
  DBBudgetDivision,
} from "@shared/database-types";

interface TestModeData {
  transactions: DBTransaction[];
  categories: DBCategory[];
  investments: DBInvestment[];
  goals: DBGoal[];
  budgetDivisions: DBBudgetDivision[];
  fgtsBalance: number;
}

const STORAGE_KEY = "test-mode-data";
const DEFAULT_CATEGORIES: DBCategory[] = [
  {
    id: "cat-1",
    user_id: "test-user-001",
    name: "Salário",
    type: "receita",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "💼",
    color: "#10b981",
  },
  {
    id: "cat-2",
    user_id: "test-user-001",
    name: "Freelance",
    type: "receita",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "💻",
    color: "#3b82f6",
  },
  {
    id: "cat-3",
    user_id: "test-user-001",
    name: "Investimentos",
    type: "receita",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "📈",
    color: "#8b5cf6",
  },
  {
    id: "cat-4",
    user_id: "test-user-001",
    name: "Alimentação",
    type: "despesa",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "🍔",
    color: "#f59e0b",
  },
  {
    id: "cat-5",
    user_id: "test-user-001",
    name: "Transporte",
    type: "despesa",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "🚗",
    color: "#ef4444",
  },
  {
    id: "cat-6",
    user_id: "test-user-001",
    name: "Moradia",
    type: "despesa",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "🏠",
    color: "#6366f1",
  },
  {
    id: "cat-7",
    user_id: "test-user-001",
    name: "Saúde",
    type: "despesa",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "⚕️",
    color: "#06b6d4",
  },
  {
    id: "cat-8",
    user_id: "test-user-001",
    name: "Educação",
    type: "despesa",
    is_default: true,
    created_at: new Date().toISOString(),
    icon: "📚",
    color: "#14b8a6",
  },
];

class LocalStorageService {
  private isTestMode(): boolean {
    if (typeof window === "undefined") return false;
    return sessionStorage.getItem("testMode") === "true";
  }

  private getTestModeData(): TestModeData {
    if (!this.isTestMode()) {
      throw new Error("Not in test mode");
    }

    const data = localStorage.getItem(STORAGE_KEY);
    if (!data) {
      const defaultData: TestModeData = {
        transactions: [],
        categories: DEFAULT_CATEGORIES,
        investments: [],
        goals: [],
        budgetDivisions: [],
        fgtsBalance: 0,
      };
      this.saveTestModeData(defaultData);
      return defaultData;
    }

    return JSON.parse(data);
  }

  private saveTestModeData(data: TestModeData): void {
    if (this.isTestMode()) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    }
  }

  private generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // Transactions
  async getTransactions(): Promise<DBTransaction[]> {
    if (!this.isTestMode()) throw new Error("Not in test mode");
    const data = this.getTestModeData();
    return data.transactions;
  }

  async createTransaction(
    transaction: Omit<DBTransaction, "id" | "created_at" | "updated_at">,
  ): Promise<DBTransaction> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const now = new Date().toISOString();
    const newTransaction: DBTransaction = {
      ...transaction,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };

    data.transactions.push(newTransaction);
    this.saveTestModeData(data);
    return newTransaction;
  }

  async updateTransaction(
    id: string,
    updates: Partial<DBTransaction>,
  ): Promise<DBTransaction> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const index = data.transactions.findIndex((t) => t.id === id);
    if (index === -1) throw new Error("Transaction not found");

    data.transactions[index] = {
      ...data.transactions[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveTestModeData(data);
    return data.transactions[index];
  }

  async deleteTransaction(id: string): Promise<void> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    data.transactions = data.transactions.filter((t) => t.id !== id);
    this.saveTestModeData(data);
  }

  // Categories
  async getCategories(): Promise<DBCategory[]> {
    if (!this.isTestMode()) throw new Error("Not in test mode");
    const data = this.getTestModeData();
    return data.categories;
  }

  async createCategory(
    category: Omit<DBCategory, "id" | "created_at">,
  ): Promise<DBCategory> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const newCategory: DBCategory = {
      ...category,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };

    data.categories.push(newCategory);
    this.saveTestModeData(data);
    return newCategory;
  }

  async deleteCategory(id: string): Promise<void> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    data.categories = data.categories.filter((c) => c.id !== id);
    this.saveTestModeData(data);
  }

  // Investments
  async getInvestments(): Promise<DBInvestment[]> {
    if (!this.isTestMode()) throw new Error("Not in test mode");
    const data = this.getTestModeData();
    return data.investments;
  }

  async createInvestment(
    investment: Omit<DBInvestment, "id" | "created_at" | "updated_at">,
  ): Promise<DBInvestment> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const now = new Date().toISOString();
    const newInvestment: DBInvestment = {
      ...investment,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };

    data.investments.push(newInvestment);
    this.saveTestModeData(data);
    return newInvestment;
  }

  async updateInvestment(
    id: string,
    updates: Partial<DBInvestment>,
  ): Promise<DBInvestment> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const index = data.investments.findIndex((i) => i.id === id);
    if (index === -1) throw new Error("Investment not found");

    data.investments[index] = {
      ...data.investments[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveTestModeData(data);
    return data.investments[index];
  }

  async deleteInvestment(id: string): Promise<void> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    data.investments = data.investments.filter((i) => i.id !== id);
    this.saveTestModeData(data);
  }

  // Goals
  async getGoals(): Promise<DBGoal[]> {
    if (!this.isTestMode()) throw new Error("Not in test mode");
    const data = this.getTestModeData();
    return data.goals;
  }

  async createGoal(
    goal: Omit<DBGoal, "id" | "created_at" | "updated_at">,
  ): Promise<DBGoal> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const now = new Date().toISOString();
    const newGoal: DBGoal = {
      ...goal,
      id: this.generateId(),
      created_at: now,
      updated_at: now,
    };

    data.goals.push(newGoal);
    this.saveTestModeData(data);
    return newGoal;
  }

  async updateGoal(id: string, updates: Partial<DBGoal>): Promise<DBGoal> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const index = data.goals.findIndex((g) => g.id === id);
    if (index === -1) throw new Error("Goal not found");

    data.goals[index] = {
      ...data.goals[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveTestModeData(data);
    return data.goals[index];
  }

  async deleteGoal(id: string): Promise<void> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    data.goals = data.goals.filter((g) => g.id !== id);
    this.saveTestModeData(data);
  }

  // Budget Divisions
  async getBudgetDivisions(): Promise<DBBudgetDivision[]> {
    if (!this.isTestMode()) throw new Error("Not in test mode");
    const data = this.getTestModeData();
    return data.budgetDivisions;
  }

  async createBudgetDivision(
    division: Omit<DBBudgetDivision, "id" | "created_at">,
  ): Promise<DBBudgetDivision> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const newDivision: DBBudgetDivision = {
      ...division,
      id: this.generateId(),
      created_at: new Date().toISOString(),
    };

    data.budgetDivisions.push(newDivision);
    this.saveTestModeData(data);
    return newDivision;
  }

  async updateBudgetDivision(
    id: string,
    updates: Partial<DBBudgetDivision>,
  ): Promise<DBBudgetDivision> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    const index = data.budgetDivisions.findIndex((d) => d.id === id);
    if (index === -1) throw new Error("Budget division not found");

    data.budgetDivisions[index] = {
      ...data.budgetDivisions[index],
      ...updates,
      updated_at: new Date().toISOString(),
    };

    this.saveTestModeData(data);
    return data.budgetDivisions[index];
  }

  async deleteBudgetDivision(id: string): Promise<void> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    data.budgetDivisions = data.budgetDivisions.filter((d) => d.id !== id);
    this.saveTestModeData(data);
  }

  // FGTS Balance
  async getFGTSBalance(): Promise<number> {
    if (!this.isTestMode()) throw new Error("Not in test mode");
    const data = this.getTestModeData();
    return data.fgtsBalance;
  }

  async updateFGTSBalance(amount: number): Promise<number> {
    if (!this.isTestMode()) throw new Error("Not in test mode");

    const data = this.getTestModeData();
    data.fgtsBalance = amount;
    this.saveTestModeData(data);
    return amount;
  }

  // Clear all test data
  clearTestData(): void {
    localStorage.removeItem(STORAGE_KEY);
  }
}

export const localStorageService = new LocalStorageService();
