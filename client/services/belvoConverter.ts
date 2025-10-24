import { BelvoTransaction, BelvoAccount } from '@shared/belvo-types';
import { Transaction, TransactionType, Category } from '@shared/financial-types';

/**
 * Serviço para converter dados da API Belvo para o formato do Capital
 */
class BelvoConverterService {
  
  // Mapear categorias Belvo para categorias do Capital
  private mapCategory(belvoCategory: string, amount: number): string {
    const isIncome = amount > 0;
    
    if (isIncome) {
      // Mapear receitas
      if (belvoCategory.includes('salary') || belvoCategory.includes('salario')) {
        return 'salario';
      }
      if (belvoCategory.includes('transfer') || belvoCategory.includes('investment')) {
        return 'investimentos';
      }
      return 'outros-receitas';
    } else {
      // Mapear despesas
      const category = belvoCategory.toLowerCase();
      
      if (category.includes('food') || category.includes('restaurant') || category.includes('alimentacao')) {
        return 'alimentacao';
      }
      if (category.includes('transport') || category.includes('uber') || category.includes('transporte')) {
        return 'transporte';
      }
      if (category.includes('rent') || category.includes('utilities') || category.includes('moradia')) {
        return 'moradia';
      }
      if (category.includes('health') || category.includes('medical') || category.includes('saude')) {
        return 'saude';
      }
      if (category.includes('education') || category.includes('educacao')) {
        return 'educacao';
      }
      if (category.includes('entertainment') || category.includes('leisure') || category.includes('entretenimento')) {
        return 'entretenimento';
      }
      if (category.includes('shopping') || category.includes('retail') || category.includes('compras')) {
        return 'compras';
      }
      if (category.includes('service') || category.includes('subscription') || category.includes('servicos')) {
        return 'servicos';
      }
      
      return 'outros-despesas';
    }
  }

  // Converter transação Belvo para formato Capital
  public convertTransaction(
    belvoTransaction: BelvoTransaction,
    categories: Category[]
  ): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'> {
    const amount = Math.abs(belvoTransaction.amount);
    const type: TransactionType = belvoTransaction.amount > 0 ? 'receita' : 'despesa';
    
    const categoryId = this.mapCategory(belvoTransaction.category, belvoTransaction.amount);
    const category = categories.find(c => c.id === categoryId);
    
    return {
      type,
      category: categoryId,
      categoryName: category?.name || categoryId,
      description: this.cleanDescription(belvoTransaction.description),
      amount,
      date: belvoTransaction.accounting_date,
      source: 'open-finance',
      sourceDetails: {
        bank: belvoTransaction.account.name,
        account: belvoTransaction.account.id,
        card: belvoTransaction.credit_card_data?.bill_name
      },
      tags: this.extractTags(belvoTransaction)
    };
  }

  // Limpar e melhorar descrição da transação
  private cleanDescription(description: string): string {
    let cleaned = description
      .trim()
      .replace(/\s+/g, ' ') // Remove espaços extras
      .replace(/[^\w\s\-\.\,]/g, '') // Remove caracteres especiais
      .substring(0, 100); // Limita a 100 caracteres

    // Capitalizar primeira letra
    if (cleaned.length > 0) {
      cleaned = cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase();
    }

    return cleaned || 'Transação sem descrição';
  }

  // Extrair tags úteis da transação
  private extractTags(belvoTransaction: BelvoTransaction): string[] {
    const tags: string[] = [];
    
    // Adicionar tipo de conta
    if (belvoTransaction.account.type) {
      tags.push(belvoTransaction.account.type);
    }
    
    // Adicionar subcategoria se disponível
    if (belvoTransaction.subcategory) {
      tags.push(belvoTransaction.subcategory);
    }
    
    // Adicionar informações de merchant
    if (belvoTransaction.merchant?.name) {
      tags.push(belvoTransaction.merchant.name);
    }
    
    // Adicionar informações de cartão de crédito
    if (belvoTransaction.credit_card_data?.bill_name) {
      tags.push('cartao-credito');
    }
    
    // Adicionar tag de origem
    tags.push('belvo');
    
    return tags.filter(tag => tag && tag.length > 0);
  }

  // Converter múltiplas transações
  public convertTransactions(
    belvoTransactions: BelvoTransaction[],
    categories: Category[]
  ): Array<Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>> {
    return belvoTransactions.map(transaction => 
      this.convertTransaction(transaction, categories)
    );
  }

  // Estatísticas da conversão
  public getConversionStats(
    belvoTransactions: BelvoTransaction[]
  ): {
    total: number;
    income: number;
    expenses: number;
    categories: Record<string, number>;
    dateRange: { start: string; end: string } | null;
  } {
    if (belvoTransactions.length === 0) {
      return {
        total: 0,
        income: 0,
        expenses: 0,
        categories: {},
        dateRange: null
      };
    }

    const categories: Record<string, number> = {};
    let income = 0;
    let expenses = 0;

    // Processar transações
    belvoTransactions.forEach(transaction => {
      const categoryId = this.mapCategory(transaction.category, transaction.amount);
      categories[categoryId] = (categories[categoryId] || 0) + 1;
      
      if (transaction.amount > 0) {
        income++;
      } else {
        expenses++;
      }
    });

    // Calcular range de datas
    const dates = belvoTransactions
      .map(t => t.accounting_date)
      .sort();
    
    const dateRange = dates.length > 0 ? {
      start: dates[0],
      end: dates[dates.length - 1]
    } : null;

    return {
      total: belvoTransactions.length,
      income,
      expenses,
      categories,
      dateRange
    };
  }

  // Detectar transações duplicadas
  public detectDuplicates(
    belvoTransactions: BelvoTransaction[],
    existingTransactions: Transaction[]
  ): {
    duplicates: BelvoTransaction[];
    newTransactions: BelvoTransaction[];
  } {
    const duplicates: BelvoTransaction[] = [];
    const newTransactions: BelvoTransaction[] = [];

    belvoTransactions.forEach(belvoTx => {
      const isDuplicate = existingTransactions.some(existingTx => {
        // Verificar se é duplicata baseado em:
        // 1. Valor similar (diferença de até R$ 0.01)
        // 2. Data similar (mesmo dia)
        // 3. Descrição similar (pelo menos 70% de similaridade)
        
        const amountMatch = Math.abs(Math.abs(belvoTx.amount) - existingTx.amount) <= 0.01;
        const dateMatch = belvoTx.accounting_date === existingTx.date;
        const descMatch = this.calculateSimilarity(
          this.cleanDescription(belvoTx.description),
          existingTx.description
        ) >= 0.7;

        return amountMatch && dateMatch && descMatch;
      });

      if (isDuplicate) {
        duplicates.push(belvoTx);
      } else {
        newTransactions.push(belvoTx);
      }
    });

    return { duplicates, newTransactions };
  }

  // Calcular similaridade entre duas strings
  private calculateSimilarity(str1: string, str2: string): number {
    const longer = str1.length > str2.length ? str1 : str2;
    const shorter = str1.length > str2.length ? str2 : str1;
    
    if (longer.length === 0) {
      return 1.0;
    }
    
    const editDistance = this.levenshteinDistance(longer, shorter);
    return (longer.length - editDistance) / longer.length;
  }

  // Calcular distância de Levenshtein
  private levenshteinDistance(str1: string, str2: string): number {
    const matrix = [];
    
    for (let i = 0; i <= str2.length; i++) {
      matrix[i] = [i];
    }
    
    for (let j = 0; j <= str1.length; j++) {
      matrix[0][j] = j;
    }
    
    for (let i = 1; i <= str2.length; i++) {
      for (let j = 1; j <= str1.length; j++) {
        if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
          matrix[i][j] = matrix[i - 1][j - 1];
        } else {
          matrix[i][j] = Math.min(
            matrix[i - 1][j - 1] + 1,
            matrix[i][j - 1] + 1,
            matrix[i - 1][j] + 1
          );
        }
      }
    }
    
    return matrix[str2.length][str1.length];
  }

  // Gerar resumo da conta Belvo
  public generateAccountSummary(account: BelvoAccount): {
    name: string;
    type: string;
    balance: number;
    institution: string;
    lastUpdate: string;
  } {
    return {
      name: account.name,
      type: account.type,
      balance: account.balance.current,
      institution: account.institution.name,
      lastUpdate: account.last_accessed_at
    };
  }
}

// Singleton instance
export const belvoConverter = new BelvoConverterService();
export default belvoConverter;
