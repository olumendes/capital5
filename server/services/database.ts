import { 
  CloudflareEnv, 
  User, 
  DBCategory, 
  DBTransaction, 
  DBInvestment, 
  DBGoal,
  DBBudgetDivision,
  DBBudgetCategory,
  DBBudgetAllocation,
  DBGoalAllocation,
  TransactionFilters,
  InvestmentFilters,
  GoalFilters
} from '@shared/database-types';
import { generateId } from '../utils/auth';

export class DatabaseService {
  constructor(private db: D1Database) {}

  // ========== USUÁRIOS ==========
  async createUser(email: string, passwordHash: string, name?: string): Promise<User> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare('INSERT INTO users (id, email, password_hash, name, created_at, updated_at) VALUES (?, ?, ?, ?, ?, ?)')
      .bind(id, email, passwordHash, name || null, now, now)
      .run();

    return {
      id,
      email,
      name,
      created_at: now,
      updated_at: now
    };
  }

  async getUserByEmail(email: string): Promise<(User & { password_hash: string }) | null> {
    const result = await this.db
      .prepare('SELECT * FROM users WHERE email = ?')
      .bind(email)
      .first();

    return result as (User & { password_hash: string }) | null;
  }

  async getUserById(id: string): Promise<User | null> {
    const result = await this.db
      .prepare('SELECT id, email, name, created_at, updated_at FROM users WHERE id = ?')
      .bind(id)
      .first();

    return result as User | null;
  }

  // ========== CATEGORIAS ==========
  async getCategories(userId: string): Promise<DBCategory[]> {
    let results = await this.db
      .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type, name')
      .bind(userId)
      .all();

    let categories = results.results as DBCategory[];

    // Auto-seed categorias padrão se estiver vazio
    if (!categories || categories.length === 0) {
      await this.createDefaultCategories(userId);
      results = await this.db
        .prepare('SELECT * FROM categories WHERE user_id = ? ORDER BY type, name')
        .bind(userId)
        .all();
      categories = results.results as DBCategory[];
    }

    return categories;
  }

  async createCategory(userId: string, category: Omit<DBCategory, 'id' | 'user_id' | 'created_at'>): Promise<DBCategory> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO categories (id, user_id, name, icon, color, type, is_default, created_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(id, userId, category.name, category.icon || null, category.color || null, category.type, category.is_default, now)
      .run();

    return {
      id,
      user_id: userId,
      created_at: now,
      ...category
    };
  }

  async deleteCategory(userId: string, categoryId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM categories WHERE id = ? AND user_id = ? AND is_default = FALSE')
      .bind(categoryId, userId)
      .run();

    return result.changes > 0;
  }

  // Criar categorias padrão para novo usuário
  async createDefaultCategories(userId: string): Promise<void> {
    const defaultCategories = [
      // Receitas
      { name: 'Salário', type: 'receita', icon: '💼', color: '#10B981' },
      { name: 'Freelance', type: 'receita', icon: '💻', color: '#059669' },
      { name: 'Rendimentos', type: 'receita', icon: '📈', color: '#047857' },
      { name: 'Outras Receitas', type: 'receita', icon: '💰', color: '#065F46' },
      
      // Despesas
      { name: 'Alimentação', type: 'despesa', icon: '🍽️', color: '#EF4444' },
      { name: 'Transporte', type: 'despesa', icon: '🚗', color: '#DC2626' },
      { name: 'Moradia', type: 'despesa', icon: '🏠', color: '#B91C1C' },
      { name: 'Saúde', type: 'despesa', icon: '⚕️', color: '#991B1B' },
      { name: 'Educação', type: 'despesa', icon: '📚', color: '#7F1D1D' },
      { name: 'Entretenimento', type: 'despesa', icon: '🎬', color: '#F97316' },
      { name: 'Compras', type: 'despesa', icon: '🛍️', color: '#EA580C' },
      { name: 'Serviços', type: 'despesa', icon: '🔧', color: '#C2410C' },
      { name: 'Outras Despesas', type: 'despesa', icon: '📝', color: '#9A3412' }
    ];

    for (const category of defaultCategories) {
      await this.createCategory(userId, { ...category, is_default: true });
    }
  }

  // ========== TRANSAÇÕES ==========
  async getTransactions(userId: string, filters?: TransactionFilters): Promise<{ transactions: DBTransaction[], total: number }> {
    let query = 'SELECT * FROM transactions WHERE user_id = ?';
    let countQuery = 'SELECT COUNT(*) as total FROM transactions WHERE user_id = ?';
    const whereParams: any[] = [userId];

    // Aplicar filtros (mesmos para query e count)
    if (filters?.start_date) {
      query += ' AND date >= ?';
      countQuery += ' AND date >= ?';
      whereParams.push(filters.start_date);
    }

    if (filters?.end_date) {
      query += ' AND date <= ?';
      countQuery += ' AND date <= ?';
      whereParams.push(filters.end_date);
    }

    if (filters?.type) {
      query += ' AND type = ?';
      countQuery += ' AND type = ?';
      whereParams.push(filters.type);
    }

    if (filters?.category_id) {
      query += ' AND category_id = ?';
      countQuery += ' AND category_id = ?';
      whereParams.push(filters.category_id);
    }

    if (filters?.source) {
      query += ' AND source = ?';
      countQuery += ' AND source = ?';
      whereParams.push(filters.source);
    }

    if (filters?.min_amount !== undefined) {
      query += ' AND amount >= ?';
      countQuery += ' AND amount >= ?';
      whereParams.push(filters.min_amount);
    }

    if (filters?.max_amount !== undefined) {
      query += ' AND amount <= ?';
      countQuery += ' AND amount <= ?';
      whereParams.push(filters.max_amount);
    }

    if (filters?.search) {
      query += ' AND description LIKE ?';
      countQuery += ' AND description LIKE ?';
      whereParams.push(`%${filters.search}%`);
    }

    // Ordenação e paginação
    query += ' ORDER BY date DESC, created_at DESC';

    const queryParams = [...whereParams];
    if (filters?.limit) {
      query += ' LIMIT ?';
      queryParams.push(filters.limit);

      if (filters?.page && filters.page > 1) {
        query += ' OFFSET ?';
        queryParams.push((filters.page - 1) * filters.limit);
      }
    }

    const [transactionsResult, countResult] = await Promise.all([
      this.db.prepare(query).bind(...queryParams).all(),
      this.db.prepare(countQuery).bind(...whereParams).first()
    ]);

    return {
      transactions: transactionsResult.results as DBTransaction[],
      total: (countResult as any)?.total || 0
    };
  }

  async createTransaction(userId: string, transaction: Omit<DBTransaction, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBTransaction> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO transactions (id, user_id, type, category_id, description, amount, date, source, source_details, tags, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id, userId, transaction.type, transaction.category_id, transaction.description,
        transaction.amount, transaction.date, transaction.source,
        transaction.source_details || null, transaction.tags || null, now, now
      )
      .run();

    return {
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      ...transaction
    };
  }

  async updateTransaction(userId: string, transactionId: string, updates: Partial<Omit<DBTransaction, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> {
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        setParts.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (setParts.length === 0) return false;

    setParts.push('updated_at = ?');
    params.push(now, transactionId, userId);

    const result = await this.db
      .prepare(`UPDATE transactions SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    return result.changes > 0;
  }

  async deleteTransaction(userId: string, transactionId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM transactions WHERE id = ? AND user_id = ?')
      .bind(transactionId, userId)
      .run();

    return result.changes > 0;
  }

  // ========== INVESTIMENTOS ==========
  async getInvestments(userId: string, filters?: InvestmentFilters): Promise<DBInvestment[]> {
    let query = 'SELECT * FROM investments WHERE user_id = ?';
    const params: any[] = [userId];

    if (filters?.type) {
      query += ' AND type = ?';
      params.push(filters.type);
    }

    if (filters?.broker) {
      query += ' AND broker = ?';
      params.push(filters.broker);
    }

    query += ' ORDER BY purchase_date DESC';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as DBInvestment[];
  }

  async createInvestment(userId: string, investment: Omit<DBInvestment, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBInvestment> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO investments (id, user_id, name, type, purchase_date, purchase_price, quantity, current_price, broker, notes, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id, userId, investment.name, investment.type, investment.purchase_date,
        investment.purchase_price, investment.quantity, investment.current_price || null,
        investment.broker || null, investment.notes || null, now, now
      )
      .run();

    return {
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      ...investment
    };
  }

  async updateInvestment(userId: string, investmentId: string, updates: Partial<Omit<DBInvestment, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> {
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        setParts.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (setParts.length === 0) return false;

    setParts.push('updated_at = ?');
    params.push(now, investmentId, userId);

    const result = await this.db
      .prepare(`UPDATE investments SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    return result.changes > 0;
  }

  async deleteInvestment(userId: string, investmentId: string): Promise<boolean> {
    const result = await this.db
      .prepare('DELETE FROM investments WHERE id = ? AND user_id = ?')
      .bind(investmentId, userId)
      .run();

    return result.changes > 0;
  }

  // ========== OBJETIVOS ==========
  async getGoals(userId: string, filters?: GoalFilters): Promise<DBGoal[]> {
    let query = 'SELECT * FROM goals WHERE user_id = ?';
    const params: any[] = [userId];

    if (filters?.status) {
      query += ' AND status = ?';
      params.push(filters.status);
    }

    query += ' ORDER BY created_at DESC';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as DBGoal[];
  }

  async createGoal(userId: string, goal: Omit<DBGoal, 'id' | 'user_id' | 'current_amount' | 'created_at' | 'updated_at'>): Promise<DBGoal> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO goals (id, user_id, title, target_amount, current_amount, target_date, description, status, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id, userId, goal.title, goal.target_amount, 0,
        goal.target_date || null, goal.description || null, goal.status || 'active', now, now
      )
      .run();

    return {
      id,
      user_id: userId,
      current_amount: 0,
      created_at: now,
      updated_at: now,
      ...goal
    };
  }

  async updateGoal(userId: string, goalId: string, updates: Partial<Omit<DBGoal, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> {
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        setParts.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (setParts.length === 0) return false;

    setParts.push('updated_at = ?');
    params.push(now, goalId, userId);

    const result = await this.db
      .prepare(`UPDATE goals SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    return result.changes > 0;
  }

  async deleteGoal(userId: string, goalId: string): Promise<boolean> {
    // Primeiro deletar alocações relacionadas
    await this.db
      .prepare('DELETE FROM goal_allocations WHERE goal_id = ? AND user_id = ?')
      .bind(goalId, userId)
      .run();

    const result = await this.db
      .prepare('DELETE FROM goals WHERE id = ? AND user_id = ?')
      .bind(goalId, userId)
      .run();

    return result.changes > 0;
  }

  // ========== DIVISÃO FINANCEIRA ==========
  async getBudgetDivisions(userId: string): Promise<DBBudgetDivision[]> {
    const result = await this.db
      .prepare('SELECT * FROM budget_divisions WHERE user_id = ? ORDER BY sort_order, name')
      .bind(userId)
      .all();

    return result.results as DBBudgetDivision[];
  }

  async createBudgetDivision(userId: string, division: Omit<DBBudgetDivision, 'id' | 'user_id' | 'created_at' | 'updated_at'>): Promise<DBBudgetDivision> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO budget_divisions (id, user_id, name, percentage, color, description, sort_order, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id, userId, division.name, division.percentage, division.color || null,
        division.description || null, division.sort_order, now, now
      )
      .run();

    return {
      id,
      user_id: userId,
      created_at: now,
      updated_at: now,
      ...division
    };
  }

  async updateBudgetDivision(userId: string, divisionId: string, updates: Partial<Omit<DBBudgetDivision, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> {
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        setParts.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (setParts.length === 0) return false;

    setParts.push('updated_at = ?');
    params.push(now, divisionId, userId);

    const result = await this.db
      .prepare(`UPDATE budget_divisions SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    return result.changes > 0;
  }

  async deleteBudgetDivision(userId: string, divisionId: string): Promise<boolean> {
    // Primeiro deletar categorias e alocações relacionadas
    await this.db
      .prepare('DELETE FROM budget_allocations WHERE budget_category_id IN (SELECT id FROM budget_categories WHERE division_id = ?) AND user_id = ?')
      .bind(divisionId, userId)
      .run();

    await this.db
      .prepare('DELETE FROM budget_categories WHERE division_id = ? AND user_id = ?')
      .bind(divisionId, userId)
      .run();

    const result = await this.db
      .prepare('DELETE FROM budget_divisions WHERE id = ? AND user_id = ?')
      .bind(divisionId, userId)
      .run();

    return result.changes > 0;
  }

  // ========== CATEGORIAS DE ORÇAMENTO ==========
  async getBudgetCategories(userId: string, divisionId?: string): Promise<DBBudgetCategory[]> {
    let query = 'SELECT * FROM budget_categories WHERE user_id = ?';
    const params: any[] = [userId];

    if (divisionId) {
      query += ' AND division_id = ?';
      params.push(divisionId);
    }

    query += ' ORDER BY name';

    const result = await this.db.prepare(query).bind(...params).all();
    return result.results as DBBudgetCategory[];
  }

  async createBudgetCategory(userId: string, category: Omit<DBBudgetCategory, 'id' | 'user_id' | 'spent_amount' | 'created_at' | 'updated_at'>): Promise<DBBudgetCategory> {
    const id = generateId();
    const now = new Date().toISOString();

    await this.db
      .prepare(`INSERT INTO budget_categories (id, user_id, division_id, name, allocated_amount, spent_amount, icon, color, created_at, updated_at) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`)
      .bind(
        id, userId, category.division_id, category.name, category.allocated_amount, 0,
        category.icon || null, category.color || null, now, now
      )
      .run();

    return {
      id,
      user_id: userId,
      spent_amount: 0,
      created_at: now,
      updated_at: now,
      ...category
    };
  }

  async updateBudgetCategory(userId: string, categoryId: string, updates: Partial<Omit<DBBudgetCategory, 'id' | 'user_id' | 'created_at'>>): Promise<boolean> {
    const now = new Date().toISOString();
    
    const setParts: string[] = [];
    const params: any[] = [];

    Object.entries(updates).forEach(([key, value]) => {
      if (key !== 'id' && key !== 'user_id' && key !== 'created_at' && value !== undefined) {
        setParts.push(`${key} = ?`);
        params.push(value);
      }
    });

    if (setParts.length === 0) return false;

    setParts.push('updated_at = ?');
    params.push(now, categoryId, userId);

    const result = await this.db
      .prepare(`UPDATE budget_categories SET ${setParts.join(', ')} WHERE id = ? AND user_id = ?`)
      .bind(...params)
      .run();

    return result.changes > 0;
  }

  async deleteBudgetCategory(userId: string, categoryId: string): Promise<boolean> {
    // Primeiro deletar alocações relacionadas
    await this.db
      .prepare('DELETE FROM budget_allocations WHERE budget_category_id = ? AND user_id = ?')
      .bind(categoryId, userId)
      .run();

    const result = await this.db
      .prepare('DELETE FROM budget_categories WHERE id = ? AND user_id = ?')
      .bind(categoryId, userId)
      .run();

    return result.changes > 0;
  }
}
