import { useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { getGoalCategory } from '@shared/goal-types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { PiggyBank, Plus } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface GoalContributionModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function GoalContributionModal({ children, open, onOpenChange }: GoalContributionModalProps) {
  const { getGoalsWithStatus, updateGoalAmount } = useGoals();
  const { toast } = useToast();
  
  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [amount, setAmount] = useState('');

  const goals = getGoalsWithStatus().filter(goal => goal.status !== 'concluido');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedGoalId || !amount) {
      toast({
        title: "Campos obrigatórios",
        description: "Selecione um objetivo e informe o valor",
        variant: "destructive"
      });
      return;
    }

    const contributionAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(contributionAmount) || contributionAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser um número positivo",
        variant: "destructive"
      });
      return;
    }

    const goal = goals.find(g => g.id === selectedGoalId);
    if (goal) {
      const newAmount = goal.currentAmount + contributionAmount;
      updateGoalAmount(selectedGoalId, newAmount);
      
      toast({
        title: "Contribuição adicionada",
        description: `R$ ${contributionAmount.toFixed(2)} adicionado ao objetivo "${goal.name}"`
      });
    }

    // Reset form
    setSelectedGoalId('');
    setAmount('');
    onOpenChange?.(false);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <PiggyBank className="h-5 w-5" />
            Contribuir para Objetivo
          </DialogTitle>
          <DialogDescription>
            Adicione dinheiro a um dos seus objetivos
          </DialogDescription>
        </DialogHeader>

        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum objetivo ativo encontrado.</p>
            <p className="text-sm text-gray-500 mt-1">Crie objetivos na aba "Objetivos" primeiro.</p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção do Objetivo */}
            <div className="space-y-2">
              <Label htmlFor="goal">Objetivo *</Label>
              <Select value={selectedGoalId} onValueChange={setSelectedGoalId}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um objetivo" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {goals.map((goal) => {
                    const category = getGoalCategory(goal.category);
                    return (
                      <SelectItem key={goal.id} value={goal.id}>
                        <div className="flex items-center gap-2 w-full">
                          <span className="text-lg">{category?.icon || '🎯'}</span>
                          <div className="flex-1 min-w-0">
                            <p className="font-medium truncate">{goal.name}</p>
                            <div className="flex items-center gap-2 text-xs text-gray-500">
                              <span>{formatCurrency(goal.currentAmount)} / {formatCurrency(goal.targetAmount)}</span>
                              <span>({goal.progressPercent.toFixed(1)}%)</span>
                            </div>
                          </div>
                        </div>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            {/* Valor da Contribuição */}
            <div className="space-y-2">
              <Label htmlFor="amount">Valor da Contribuição * (R$)</Label>
              <Input
                id="amount"
                type="number"
                step="any"
                min="0"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Ex: 100,00"
              />
            </div>

            {/* Preview */}
            {selectedGoalId && amount && (() => {
              const goal = goals.find(g => g.id === selectedGoalId);
              const contributionAmount = parseFloat(amount.replace(',', '.'));
              
              if (goal && !isNaN(contributionAmount) && contributionAmount > 0) {
                const newAmount = goal.currentAmount + contributionAmount;
                const newProgress = Math.min(100, (newAmount / goal.targetAmount) * 100);
                
                return (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                    <h4 className="font-medium text-green-900 mb-2">Preview da Contribuição</h4>
                    <div className="space-y-1 text-sm text-green-800">
                      <div className="flex justify-between">
                        <span>Valor atual:</span>
                        <span>{formatCurrency(goal.currentAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>+ Contribuição:</span>
                        <span>{formatCurrency(contributionAmount)}</span>
                      </div>
                      <div className="flex justify-between font-medium border-t border-green-300 pt-1">
                        <span>Novo valor:</span>
                        <span>{formatCurrency(newAmount)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Progresso:</span>
                        <span>{newProgress.toFixed(1)}%</span>
                      </div>
                      {newProgress >= 100 && (
                        <p className="text-green-700 font-medium mt-2">
                          🎉 Objetivo será concluído!
                        </p>
                      )}
                    </div>
                  </div>
                );
              }
              return null;
            })()}

            <DialogFooter className="flex-col gap-2 sm:flex-row">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => onOpenChange?.(false)}
                className="w-full sm:w-auto"
              >
                Cancelar
              </Button>
              <Button type="submit" className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                Adicionar Contribuição
              </Button>
            </DialogFooter>
          </form>
        )}
      </DialogContent>
    </Dialog>
  );
}
