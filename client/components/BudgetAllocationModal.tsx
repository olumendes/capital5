import { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { useFinancial } from '../contexts/FinancialContext';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Badge } from './ui/badge';
import { TrendingDown, Wallet, PlusCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import BudgetCategoryForm from './BudgetCategoryForm';

interface BudgetAllocationModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function BudgetAllocationModal({ children, open, onOpenChange }: BudgetAllocationModalProps) {
  const { categories, addExpenseFromTransaction, getCategoryById } = useBudget();
  const { getFilteredTransactions } = useFinancial();
  const { toast } = useToast();
  
  const [selectedTransactionId, setSelectedTransactionId] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [showCategoryForm, setShowCategoryForm] = useState(false);

  // Pegar todas as despesas (qualquer mês) que ainda não foram alocadas
  const availableTransactions = getFilteredTransactions()
    .filter(t => t.type === 'despesa')
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()); // Mais recentes primeiroprimeiroprimeiro

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedTransactionId || !selectedCategoryId) {
      toast({
        title: "Seleção obrigatória",
        description: "Selecione uma transação e uma categoria",
        variant: "destructive"
      });
      return;
    }

    const transaction = availableTransactions.find(t => t.id === selectedTransactionId);
    const category = getCategoryById(selectedCategoryId);
    
    if (!transaction || !category) {
      toast({
        title: "Erro",
        description: "Transação ou categoria não encontrada",
        variant: "destructive"
      });
      return;
    }

    addExpenseFromTransaction(
      transaction.id,
      selectedCategoryId,
      transaction.amount,
      transaction.description,
      transaction.date
    );

    toast({
      title: "Transação alocada",
      description: `Transação de R$ ${transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} foi alocada à categoria "${category.name}"`
    });

    // Reset form
    setSelectedTransactionId('');
    setSelectedCategoryId('');
    onOpenChange?.(false);
  };

  const selectedTransaction = availableTransactions.find(t => t.id === selectedTransactionId);
  const selectedCategory = getCategoryById(selectedCategoryId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            Alocar Transação ao Orçamento
          </DialogTitle>
          <DialogDescription>
            Associe uma despesa a uma categoria do seu orçamento mensal
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Seleção de Transação */}
          <div className="space-y-2">
            <Label htmlFor="transaction">Selecionar Transação *</Label>
            <Select value={selectedTransactionId} onValueChange={setSelectedTransactionId}>
              <SelectTrigger>
                <SelectValue placeholder="Escolha uma despesa do mês atual" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {availableTransactions.length === 0 ? (
                  <div className="p-4 text-center text-gray-500">
                    Nenhuma despesa encontrada
                  </div>
                ) : (
                  availableTransactions.map((transaction) => (
                    <SelectItem key={transaction.id} value={transaction.id}>
                      <div className="flex flex-col w-full">
                        <div className="flex justify-between items-center w-full">
                          <span className="font-medium">{transaction.description}</span>
                          <Badge variant="destructive" className="ml-2">
                            R$ {transaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                          </Badge>
                        </div>
                        <div className="flex justify-between items-center text-xs text-gray-500 mt-1">
                          <span>{transaction.category}</span>
                          <div className="text-right">
                            <div>{format(new Date(transaction.date), 'dd/MM/yyyy', { locale: ptBR })}</div>
                            <div className="text-blue-600">{format(new Date(transaction.date), 'MMM/yyyy', { locale: ptBR })}</div>
                          </div>
                        </div>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Seleção de Categoria de Orçamento */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria de Orçamento *</Label>
            <div className="flex gap-2">
              <Select value={selectedCategoryId} onValueChange={setSelectedCategoryId}>
                <SelectTrigger className="flex-1">
                  <SelectValue placeholder="Escolha uma categoria de orçamento" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {categories.length === 0 ? (
                    <div className="p-4 text-center text-gray-500">
                      Nenhuma categoria de orçamento criada
                    </div>
                  ) : (
                    categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        <div className="flex items-center gap-2">
                          <span style={{ color: category.color }}>{category.icon}</span>
                          <div>
                            <p className="font-medium">{category.name}</p>
                            <p className="text-xs text-gray-500">
                              Limite: R$ {category.monthlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                            </p>
                          </div>
                        </div>
                      </SelectItem>
                    ))
                  )}
                </SelectContent>
              </Select>
              
              <BudgetCategoryForm open={showCategoryForm} onOpenChange={setShowCategoryForm}>
                <Button type="button" variant="outline" size="icon">
                  <PlusCircle className="h-4 w-4" />
                </Button>
              </BudgetCategoryForm>
            </div>
          </div>

          {/* Preview da alocação */}
          {selectedTransaction && selectedCategory && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-2">Preview da Alocação</h4>
              <div className="space-y-1 text-sm">
                <div className="flex justify-between">
                  <span className="text-blue-700">Transação:</span>
                  <span className="font-medium text-blue-900">{selectedTransaction.description}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Valor:</span>
                  <span className="font-medium text-red-600">
                    R$ {selectedTransaction.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Categoria:</span>
                  <span className="font-medium text-blue-900 flex items-center gap-1">
                    <span style={{ color: selectedCategory.color }}>{selectedCategory.icon}</span>
                    {selectedCategory.name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-blue-700">Data:</span>
                  <span className="font-medium text-blue-900">
                    {format(new Date(selectedTransaction.date), 'dd/MM/yyyy', { locale: ptBR })}
                  </span>
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="flex-col gap-2 sm:flex-row">
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              className="w-full sm:w-auto"
            >
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="w-full sm:w-auto"
              disabled={!selectedTransactionId || !selectedCategoryId}
            >
              <TrendingDown className="h-4 w-4 mr-2" />
              Alocar Transação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
