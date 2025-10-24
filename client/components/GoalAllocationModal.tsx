import { useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { useInvestments } from '../contexts/InvestmentContext';
import { useFinancialSummary } from '../hooks/useFinancialSummary';
import { getGoalCategory } from '@shared/goal-types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { ArrowRight, TrendingDown } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface GoalAllocationModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export default function GoalAllocationModal({ children, open, onOpenChange }: GoalAllocationModalProps) {
  const { getGoalsWithStatus, updateGoalAmount } = useGoals();
  const { allocateToGoal } = useInvestments();
  const { availableBalance, saldoAtual } = useFinancialSummary();
  const { toast } = useToast();

  const [selectedGoalId, setSelectedGoalId] = useState('');
  const [amount, setAmount] = useState('');

  const goals = getGoalsWithStatus().filter(goal => goal.status !== 'concluido');
  const currentBalance = availableBalance; // Usar saldo disponível (descontando alocações)

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

    const allocationAmount = parseFloat(amount.replace(',', '.'));

    if (isNaN(allocationAmount) || allocationAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor deve ser um número positivo",
        variant: "destructive"
      });
      return;
    }

    if (allocationAmount > currentBalance) {
      toast({
        title: "Saldo insuficiente",
        description: `Você não tem saldo disponível suficiente. Disponível: ${formatCurrency(currentBalance)}`,
        variant: "destructive"
      });
      return;
    }

    const goal = goals.find(g => g.id === selectedGoalId);
    if (!goal) return;

    // Tentar alocar de investimentos primeiro, se houver
    const investmentSuccess = allocateToGoal(allocationAmount, selectedGoalId, goal.name);

    // Se não conseguiu alocar tudo dos investimentos, permite alocação direta do saldo
    if (!investmentSuccess) {
      // Verificar se há saldo suficiente para alocação direta
      if (allocationAmount <= currentBalance) {
        // Alocação direta permitida - apenas atualiza o objetivo
        console.log(`Alocação direta do saldo: R$ ${allocationAmount} para objetivo "${goal.name}"`);
      } else {
        toast({
          title: "Saldo insuficiente",
          description: `Saldo disponível: ${formatCurrency(currentBalance)}. Você precisa de mais ${formatCurrency(allocationAmount - currentBalance)}.`,
          variant: "destructive"
        });
        return;
      }
    }

    // Atualizar o valor do objetivo
    const newAmount = goal.currentAmount + allocationAmount;
    updateGoalAmount(selectedGoalId, newAmount);

    toast({
      title: "Valor alocado com sucesso",
      description: investmentSuccess
        ? `${formatCurrency(allocationAmount)} dos seus investimentos foi alocado para "${goal.name}"`
        : `${formatCurrency(allocationAmount)} do seu saldo foi alocado para "${goal.name}"`
    });

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
            <ArrowRight className="h-5 w-5" />
            Lançar para Objetivo
          </DialogTitle>
          <DialogDescription>
            Aloque dinheiro do seu saldo ou investimentos para um objetivo específico
          </DialogDescription>
        </DialogHeader>

        {goals.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-600">Nenhum objetivo ativo encontrado.</p>
            <p className="text-sm text-gray-500 mt-1">Crie objetivos na aba "Objetivos" primeiro.</p>
          </div>
        ) : (
          <>
            {/* Saldo Atual */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Saldo Total (incluindo investimentos):</span>
                  <span className="text-lg font-bold text-blue-900">{formatCurrency(saldoAtual)}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium text-blue-900">Disponível para alocação:</span>
                  <span className="text-lg font-bold text-blue-900">{formatCurrency(currentBalance)}</span>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {/* Seleção do Objetivo */}
              <div className="space-y-2">
                <Label htmlFor="goal">Objetivo Destino *</Label>
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
                                <span className="text-orange-600">
                                  Falta: {formatCurrency(goal.remainingAmount)}
                                </span>
                              </div>
                            </div>
                          </div>
                        </SelectItem>
                      );
                    })}
                  </SelectContent>
                </Select>
              </div>

              {/* Valor a Transferir */}
              <div className="space-y-2">
                <Label htmlFor="amount">Valor a Transferir * (R$)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="any"
                  min="0"
                  max={currentBalance}
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Ex: 500,00"
                />
                <p className="text-xs text-gray-500">
                  Máximo disponível: {formatCurrency(currentBalance)}
                </p>
              </div>

              {/* Preview da Operação */}
              {selectedGoalId && amount && (() => {
                const goal = goals.find(g => g.id === selectedGoalId);
                const allocationAmount = parseFloat(amount.replace(',', '.'));
                
                if (goal && !isNaN(allocationAmount) && allocationAmount > 0) {
                  const newGoalAmount = goal.currentAmount + allocationAmount;
                  const newProgress = Math.min(100, (newGoalAmount / goal.targetAmount) * 100);
                  const newBalance = currentBalance - allocationAmount;
                  const isOverAllocation = allocationAmount > currentBalance;
                  
                  return (
                    <div className={`border rounded-lg p-3 ${isOverAllocation ? 'bg-red-50 border-red-200' : 'bg-green-50 border-green-200'}`}>
                      <h4 className={`font-medium mb-2 ${isOverAllocation ? 'text-red-900' : 'text-green-900'}`}>
                        Preview da Operação
                      </h4>
                      
                      {isOverAllocation ? (
                        <p className="text-red-800 text-sm font-medium">
                          ⚠️ Valor superior ao saldo disponível!
                        </p>
                      ) : (
                        <div className="space-y-2 text-sm">
                          {/* Saldo */}
                          <div className="flex justify-between text-blue-800">
                            <span>Seu saldo atual:</span>
                            <span>{formatCurrency(currentBalance)}</span>
                          </div>
                          <div className="flex justify-between text-blue-800">
                            <span>- Valor a transferir:</span>
                            <span>-{formatCurrency(allocationAmount)}</span>
                          </div>
                          <div className="flex justify-between font-medium text-blue-900 border-t border-green-300 pt-1">
                            <span>= Novo saldo:</span>
                            <span>{formatCurrency(newBalance)}</span>
                          </div>
                          
                          <div className="border-t border-green-300 pt-2 mt-2">
                            {/* Objetivo */}
                            <div className="flex justify-between text-green-800">
                              <span>Objetivo atual:</span>
                              <span>{formatCurrency(goal.currentAmount)}</span>
                            </div>
                            <div className="flex justify-between text-green-800">
                              <span>+ Transferência:</span>
                              <span>+{formatCurrency(allocationAmount)}</span>
                            </div>
                            <div className="flex justify-between font-medium text-green-900 border-t border-green-300 pt-1">
                              <span>= Novo valor objetivo:</span>
                              <span>{formatCurrency(newGoalAmount)}</span>
                            </div>
                            <div className="flex justify-between text-green-800 mt-1">
                              <span>Novo progresso:</span>
                              <span>{newProgress.toFixed(1)}%</span>
                            </div>
                            
                            {newProgress >= 100 && (
                              <p className="text-green-700 font-medium mt-2 text-center">
                                🎉 Objetivo será concluído!
                              </p>
                            )}
                          </div>

                          <div className="bg-yellow-50 border border-yellow-200 rounded p-2 mt-2">
                            <p className="text-xs text-yellow-800">
                              💰 <strong>{formatCurrency(allocationAmount)}</strong> será direcionado para <strong>"{goal.name}"</strong>
                              <br />
                              <small className="text-yellow-600">
                                O valor será alocado dos seus investimentos (se disponível) ou saldo atual
                              </small>
                            </p>
                          </div>
                        </div>
                      )}
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
                <Button 
                  type="submit" 
                  className="w-full sm:w-auto"
                  disabled={!selectedGoalId || !amount || parseFloat(amount.replace(',', '.')) > currentBalance}
                >
                  <ArrowRight className="h-4 w-4 mr-2" />
                  Transferir para Objetivo
                </Button>
              </DialogFooter>
            </form>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
