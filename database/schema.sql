-- Schema para Capital - Cloudflare D1 Database
-- Execução: npx wrangler d1 execute capital-db --file=database/schema.sql

-- Tabela de usuários (autenticação simples)
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    name TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Tabela de categorias
CREATE TABLE IF NOT EXISTS categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    icon TEXT,
    color TEXT,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    is_default BOOLEAN DEFAULT FALSE,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabela de transações
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    type TEXT NOT NULL CHECK (type IN ('receita', 'despesa')),
    category_id TEXT NOT NULL,
    description TEXT NOT NULL,
    amount REAL NOT NULL,
    date DATE NOT NULL,
    source TEXT DEFAULT 'manual' CHECK (source IN ('manual', 'open-finance', 'importacao')),
    source_details TEXT, -- JSON com detalhes da fonte
    tags TEXT, -- JSON array
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories (id)
);

-- Tabela de investimentos
CREATE TABLE IF NOT EXISTS investments (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    purchase_date DATE NOT NULL,
    purchase_price REAL NOT NULL,
    quantity REAL NOT NULL,
    current_price REAL,
    broker TEXT,
    notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabela de objetivos/metas
CREATE TABLE IF NOT EXISTS goals (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    title TEXT NOT NULL,
    target_amount REAL NOT NULL,
    current_amount REAL DEFAULT 0,
    target_date DATE,
    description TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabela de alocações para objetivos
CREATE TABLE IF NOT EXISTS goal_allocations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    goal_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (goal_id) REFERENCES goals (id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE
);

-- Tabela de divisão financeira/orçamento
CREATE TABLE IF NOT EXISTS budget_divisions (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    name TEXT NOT NULL,
    percentage REAL NOT NULL,
    color TEXT,
    description TEXT,
    sort_order INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE
);

-- Tabela de categorias de orçamento
CREATE TABLE IF NOT EXISTS budget_categories (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    division_id TEXT NOT NULL,
    name TEXT NOT NULL,
    allocated_amount REAL NOT NULL,
    spent_amount REAL DEFAULT 0,
    icon TEXT,
    color TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (division_id) REFERENCES budget_divisions (id) ON DELETE CASCADE
);

-- Tabela de alocações de orçamento
CREATE TABLE IF NOT EXISTS budget_allocations (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL,
    transaction_id TEXT NOT NULL,
    budget_category_id TEXT NOT NULL,
    amount REAL NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users (id) ON DELETE CASCADE,
    FOREIGN KEY (transaction_id) REFERENCES transactions (id) ON DELETE CASCADE,
    FOREIGN KEY (budget_category_id) REFERENCES budget_categories (id) ON DELETE CASCADE
);

-- Índices para performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_date ON transactions (user_id, date);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions (category_id);
CREATE INDEX IF NOT EXISTS idx_investments_user ON investments (user_id);
CREATE INDEX IF NOT EXISTS idx_goals_user ON goals (user_id);
CREATE INDEX IF NOT EXISTS idx_goal_allocations_goal ON goal_allocations (goal_id);
CREATE INDEX IF NOT EXISTS idx_budget_categories_division ON budget_categories (division_id);
CREATE INDEX IF NOT EXISTS idx_budget_allocations_category ON budget_allocations (budget_category_id);

-- Inserir categorias padrão (serão inseridas via API para cada usuário)
-- Receitas: salario, freelance, investimentos, outros-receitas
-- Despesas: alimentacao, transporte, moradia, saude, educacao, entretenimento, compras, servicos, outros-despesas
