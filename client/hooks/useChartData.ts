import { useMemo } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { format, subMonths, startOfMonth, endOfMonth, eachMonthOfInterval } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useChartData() {
  const { transactions, categories, filters } = useFinancial();

  // Dados para gráfico de pizza (distribuição de despesas por categoria)
  const expenseDistribution = useMemo(() => {
    const now = new Date();
    let startDate = startOfMonth(now);
    let endDate = endOfMonth(now);

    // Aplicar filtros de período se definidos
    if (filters.startDate) {
      startDate = new Date(filters.startDate);
    }
    if (filters.endDate) {
      endDate = new Date(filters.endDate);
    }

    // Filtrar despesas do período
    const periodExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'despesa' &&
             transactionDate >= startDate &&
             transactionDate <= endDate;
    });

    // Agrupar por categoria
    const expensesByCategory = new Map<string, number>();
    periodExpenses.forEach(transaction => {
      const current = expensesByCategory.get(transaction.category) || 0;
      expensesByCategory.set(transaction.category, current + transaction.amount);
    });

    // Calcular total para percentuais
    const total = Array.from(expensesByCategory.values()).reduce((sum, value) => sum + value, 0);

    // Converter para formato do gráfico
    const data = Array.from(expensesByCategory.entries()).map(([categoryId, amount]) => {
      const category = categories.find(cat => cat.id === categoryId);
      return {
        name: category?.name || categoryId,
        value: amount,
        color: category?.color || '#8884d8',
        percentage: total > 0 ? (amount / total) * 100 : 0,
      };
    }).sort((a, b) => b.value - a.value);

    return data;
  }, [transactions, categories, filters]);

  // Dados para gráfico de barras (evolução mensal)
  const monthlyEvolution = useMemo(() => {
    const now = new Date();
    const sixMonthsAgo = subMonths(now, 5);
    
    // Gerar todos os meses do período
    const months = eachMonthOfInterval({
      start: startOfMonth(sixMonthsAgo),
      end: endOfMonth(now)
    });

    const data = months.map(month => {
      const monthStart = startOfMonth(month);
      const monthEnd = endOfMonth(month);
      
      // Filtrar transações do mês
      const monthTransactions = transactions.filter(t => {
        const transactionDate = new Date(t.date);
        return transactionDate >= monthStart && transactionDate <= monthEnd;
      });

      // Calcular receitas e despesas
      const receitas = monthTransactions
        .filter(t => t.type === 'receita')
        .reduce((sum, t) => sum + t.amount, 0);

      const despesas = monthTransactions
        .filter(t => t.type === 'despesa')
        .reduce((sum, t) => sum + t.amount, 0);

      return {
        month: format(month, 'MMM/yy', { locale: ptBR }),
        receitas,
        despesas,
        saldo: receitas - despesas,
      };
    });

    return data;
  }, [transactions, filters]);

  // Dados para gráfico de linha (tendência de gastos)
  const expenseTrend = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 2);
    
    // Filtrar despesas dos últimos 3 meses
    const recentExpenses = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'despesa' && transactionDate >= threeMonthsAgo;
    });

    // Agrupar por data
    const expensesByDate = new Map<string, number>();
    recentExpenses.forEach(transaction => {
      const dateKey = transaction.date;
      const current = expensesByDate.get(dateKey) || 0;
      expensesByDate.set(dateKey, current + transaction.amount);
    });

    // Converter para array e ordenar por data
    const sortedData = Array.from(expensesByDate.entries())
      .map(([date, amount]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        valor: amount,
        media: 0, // Será calculado abaixo
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                     new Date(b.date.split('/').reverse().join('-')).getTime());

    // Calcular média móvel simples (3 períodos)
    const data = sortedData.map((item, index) => {
      let sum = item.valor;
      let count = 1;
      
      // Incluir períodos anteriores (máximo 2)
      for (let i = 1; i <= 2 && index - i >= 0; i++) {
        sum += sortedData[index - i].valor;
        count++;
      }
      
      return {
        ...item,
        media: sum / count,
      };
    });

    return data;
  }, [transactions, filters]);

  // Dados para gráfico de linha (tendência de receitas)
  const revenueTrend = useMemo(() => {
    const now = new Date();
    const threeMonthsAgo = subMonths(now, 2);
    
    // Filtrar receitas dos últimos 3 meses
    const recentRevenues = transactions.filter(t => {
      const transactionDate = new Date(t.date);
      return t.type === 'receita' && transactionDate >= threeMonthsAgo;
    });

    // Agrupar por data
    const revenuesByDate = new Map<string, number>();
    recentRevenues.forEach(transaction => {
      const dateKey = transaction.date;
      const current = revenuesByDate.get(dateKey) || 0;
      revenuesByDate.set(dateKey, current + transaction.amount);
    });

    // Converter para array e ordenar por data
    const sortedData = Array.from(revenuesByDate.entries())
      .map(([date, amount]) => ({
        date: format(new Date(date), 'dd/MM', { locale: ptBR }),
        valor: amount,
        media: 0,
      }))
      .sort((a, b) => new Date(a.date.split('/').reverse().join('-')).getTime() - 
                     new Date(b.date.split('/').reverse().join('-')).getTime());

    // Calcular média móvel simples (3 períodos)
    const data = sortedData.map((item, index) => {
      let sum = item.valor;
      let count = 1;
      
      for (let i = 1; i <= 2 && index - i >= 0; i++) {
        sum += sortedData[index - i].valor;
        count++;
      }
      
      return {
        ...item,
        media: sum / count,
      };
    });

    return data;
  }, [transactions, filters]);

  return {
    expenseDistribution,
    monthlyEvolution,
    expenseTrend,
    revenueTrend,
  };
}
