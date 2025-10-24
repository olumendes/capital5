import { useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';

// Hook para sincronizar dados entre contextos
export function useContextSync() {
  const { removeExpensesByTransaction } = useBudget();

  // Função para ser chamada quando uma transação é deletada
  const onTransactionDeleted = (transactionId: string) => {
    removeExpensesByTransaction(transactionId);
  };

  return {
    onTransactionDeleted
  };
}
