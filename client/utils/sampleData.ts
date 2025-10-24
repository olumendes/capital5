import { Transaction, DEFAULT_CATEGORIES } from '@shared/financial-types';

// Função para gerar transações de exemplo
export function generateSampleTransactions(): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] {
  const now = new Date();
  const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

  // Receitas (salários mensais dos últimos 6 meses)
  for (let i = 0; i < 6; i++) {
    const date = new Date(now.getFullYear(), now.getMonth() - i, 5);
    transactions.push({
      type: 'receita',
      category: 'salario',
      categoryName: 'Salário',
      description: `Salário ${date.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}`,
      amount: 5500 + Math.random() * 500, // Variação entre 5500 e 6000
      date: date.toISOString().split('T')[0],
      source: 'manual',
      tags: ['trabalho', 'mensal']
    });
  }

  // Freelances ocasionais
  const freelanceMonths = [0, 2, 4]; // Meses com freelance
  freelanceMonths.forEach(monthsBack => {
    const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, 15 + Math.floor(Math.random() * 10));
    transactions.push({
      type: 'receita',
      category: 'freelance',
      categoryName: 'Freelance',
      description: `Projeto de desenvolvimento web`,
      amount: 800 + Math.random() * 1200, // Entre 800 e 2000
      date: date.toISOString().split('T')[0],
      source: 'manual',
      tags: ['freelance', 'projeto']
    });
  });

  // Despesas mensais recorrentes
  const recurrentExpenses = [
    { category: 'moradia', name: 'Aluguel', amount: 1200, day: 10, description: 'Aluguel do apartamento' },
    { category: 'moradia', name: 'Condomínio', amount: 250, day: 15, description: 'Taxa de condomínio' },
    { category: 'moradia', name: 'Internet', amount: 89.90, day: 8, description: 'Internet fibra 200MB' },
    { category: 'moradia', name: 'Energia', amount: 150, day: 20, description: 'Conta de luz', variation: 50 },
    { category: 'servicos', name: 'Academia', amount: 79.90, day: 5, description: 'Mensalidade da academia' },
    { category: 'transporte', name: 'Combustível', amount: 300, day: 0, description: 'Abastecimento', variation: 100, frequency: 2 }
  ];

  // Gerar despesas recorrentes para os últimos 6 meses
  for (let monthsBack = 0; monthsBack < 6; monthsBack++) {
    recurrentExpenses.forEach(expense => {
      const frequency = expense.frequency || 1;
      for (let freq = 0; freq < frequency; freq++) {
        const baseDay = expense.day || Math.floor(Math.random() * 28) + 1;
        const day = freq === 0 ? baseDay : baseDay + (freq * 15);
        
        if (day <= 28) { // Garantir que o dia é válido
          const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, day);
          const variation = expense.variation || 0;
          const amount = expense.amount + (Math.random() * variation - variation/2);
          
          transactions.push({
            type: 'despesa',
            category: expense.category,
            categoryName: expense.name,
            description: expense.description,
            amount: Math.max(amount, 0),
            date: date.toISOString().split('T')[0],
            source: 'manual',
            tags: ['recorrente']
          });
        }
      }
    });
  }

  // Despesas variáveis (alimentação, entretenimento, compras)
  const variableExpenses = [
    { category: 'alimentacao', descriptions: ['Almoço restaurante', 'Supermercado', 'Padaria', 'iFood delivery', 'Café da manhã'], range: [15, 80] },
    { category: 'entretenimento', descriptions: ['Cinema', 'Netflix', 'Spotify', 'Show', 'Bar com amigos'], range: [20, 150] },
    { category: 'compras', descriptions: ['Roupas', 'Produtos de limpeza', 'Farmácia', 'Amazon', 'Eletrônicos'], range: [25, 300] },
    { category: 'transporte', descriptions: ['Uber', 'Estacionamento', 'Pedágio', 'Manutenção carro'], range: [10, 200] },
    { category: 'saude', descriptions: ['Consulta médica', 'Exame', 'Remédios', 'Dentista'], range: [50, 400] }
  ];

  // Gerar despesas variáveis para os últimos 3 meses (mais recentes)
  for (let monthsBack = 0; monthsBack < 3; monthsBack++) {
    variableExpenses.forEach(category => {
      const numTransactions = Math.floor(Math.random() * 8) + 3; // 3 a 10 transações por categoria
      
      for (let i = 0; i < numTransactions; i++) {
        const day = Math.floor(Math.random() * 28) + 1;
        const date = new Date(now.getFullYear(), now.getMonth() - monthsBack, day);
        const description = category.descriptions[Math.floor(Math.random() * category.descriptions.length)];
        const amount = Math.random() * (category.range[1] - category.range[0]) + category.range[0];
        
        transactions.push({
          type: 'despesa',
          category: category.category,
          categoryName: DEFAULT_CATEGORIES.find(cat => cat.id === category.category)?.name,
          description,
          amount: Math.round(amount * 100) / 100, // Arredondar para 2 casas decimais
          date: date.toISOString().split('T')[0],
          source: 'manual',
          tags: ['variavel']
        });
      }
    });
  }

  // Algumas transações especiais
  const specialTransactions = [
    {
      type: 'receita' as const,
      category: 'outros-receitas',
      categoryName: 'Outras Receitas',
      description: 'Devolução de imposto de renda',
      amount: 850,
      date: new Date(now.getFullYear(), now.getMonth() - 2, 12).toISOString().split('T')[0],
      source: 'manual' as const,
      tags: ['especial', 'governo']
    },
    {
      type: 'despesa' as const,
      category: 'educacao',
      categoryName: 'Educação',
      description: 'Curso online de programação',
      amount: 199.90,
      date: new Date(now.getFullYear(), now.getMonth() - 1, 3).toISOString().split('T')[0],
      source: 'manual' as const,
      tags: ['educacao', 'investimento']
    },
    {
      type: 'despesa' as const,
      category: 'compras',
      categoryName: 'Compras',
      description: 'Presente de aniversário',
      amount: 120,
      date: new Date(now.getFullYear(), now.getMonth(), 8).toISOString().split('T')[0],
      source: 'manual' as const,
      tags: ['presente', 'familia']
    }
  ];

  transactions.push(...specialTransactions);

  // Ordenar por data (mais recente primeiro)
  return transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Função para adicionar dados de exemplo ao contexto
export function loadSampleData(addTransaction: (transaction: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>) => void) {
  const sampleTransactions = generateSampleTransactions();
  
  // Adicionar com um pequeno delay para simular carregamento
  sampleTransactions.forEach((transaction, index) => {
    setTimeout(() => {
      addTransaction(transaction);
    }, index * 10); // 10ms de delay entre cada transação
  });
  
  return sampleTransactions.length;
}
