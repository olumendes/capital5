import { useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useToast } from './use-toast';

export function useBudgetNotifications() {
  const { getCategoriesStatus } = useBudget();
  const { toast } = useToast();

  useEffect(() => {
    const categoriesStatus = getCategoriesStatus();
    
    // Verificar categorias que estouraram o orçamento
    const exceededCategories = categoriesStatus.filter(status => status.status === 'exceeded');
    const warningCategories = categoriesStatus.filter(status => status.status === 'warning');

    // Notificar sobre categorias estouradas
    exceededCategories.forEach(status => {
      const overspent = status.currentSpent - status.monthlyLimit;
      toast({
        title: "Orçamento Estourado!",
        description: `A categoria "${status.category.name}" ultrapassou o limite em R$ ${overspent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`,
        variant: "destructive"
      });
    });

    // Notificar sobre categorias próximas do limite (apenas uma vez)
    if (warningCategories.length > 0 && exceededCategories.length === 0) {
      const categoryNames = warningCategories.map(s => s.category.name).join(', ');
      toast({
        title: "Atenção ao Orçamento",
        description: `${warningCategories.length === 1 ? 'A categoria' : 'As categorias'} ${categoryNames} ${warningCategories.length === 1 ? 'está próxima' : 'estão próximas'} do limite mensal`,
        variant: "default"
      });
    }
  }, [getCategoriesStatus, toast]);
}
