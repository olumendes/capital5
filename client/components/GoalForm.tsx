import { useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { GOAL_CATEGORIES, GoalCategory, getGoalCategory } from '@shared/goal-types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Target, PlusCircle } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface GoalFormProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editGoal?: any; // Goal to edit, if any
}

export default function GoalForm({ children, open, onOpenChange, editGoal }: GoalFormProps) {
  const { addGoal, updateGoal } = useGoals();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: editGoal?.name || '',
    category: editGoal?.category || '' as GoalCategory | '',
    targetAmount: editGoal?.targetAmount?.toString() || '',
    currentAmount: editGoal?.currentAmount?.toString() || '',
    deadline: editGoal?.deadline ? editGoal.deadline.split('T')[0] : '',
    description: editGoal?.description || ''
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.category || !formData.targetAmount || !formData.deadline) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha todos os campos obrigatórios",
        variant: "destructive"
      });
      return;
    }

    const targetAmount = parseFloat(formData.targetAmount.replace(',', '.'));
    const currentAmount = parseFloat(formData.currentAmount.replace(',', '.')) || 0;

    if (isNaN(targetAmount) || targetAmount <= 0) {
      toast({
        title: "Valor inválido",
        description: "O valor do objetivo deve ser um número positivo",
        variant: "destructive"
      });
      return;
    }

    if (currentAmount < 0) {
      toast({
        title: "Valor inválido",
        description: "O valor atual não pode ser negativo",
        variant: "destructive"
      });
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    if (deadlineDate < new Date()) {
      toast({
        title: "Data inválida",
        description: "A data limite deve ser no futuro",
        variant: "destructive"
      });
      return;
    }

    const goalData = {
      name: formData.name,
      category: formData.category,
      targetAmount,
      currentAmount,
      deadline: deadlineDate.toISOString(),
      description: formData.description
    };

    if (editGoal) {
      updateGoal({
        ...editGoal,
        ...goalData
      });
      toast({
        title: "Objetivo atualizado",
        description: "Objetivo atualizado com sucesso!"
      });
    } else {
      console.log('Adicionando objetivo:', goalData);
      addGoal(goalData);
      toast({
        title: "Objetivo criado",
        description: "Objetivo criado com sucesso!"
      });
    }

    // Reset form
    setFormData({
      name: '',
      category: '',
      targetAmount: '',
      currentAmount: '',
      deadline: '',
      description: ''
    });

    onOpenChange?.(false);
  };

  const selectedCategory = formData.category ? getGoalCategory(formData.category) : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Target className="h-5 w-5" />
            {editGoal ? 'Editar Objetivo' : 'Novo Objetivo'}
          </DialogTitle>
          <DialogDescription>
            {editGoal ? 'Atualize as informações do seu objetivo' : 'Defina um novo objetivo financeiro para alcançar'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Nome do Objetivo */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome do Objetivo *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Viagem para Europa, Carro novo..."
            />
          </div>

          {/* Categoria */}
          <div className="space-y-2">
            <Label htmlFor="category">Categoria *</Label>
            <Select value={formData.category} onValueChange={(value) => setFormData(prev => ({ ...prev, category: value as GoalCategory }))}>
              <SelectTrigger>
                <SelectValue placeholder="Selecione uma categoria" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                {GOAL_CATEGORIES.map((category) => (
                  <SelectItem key={category.id} value={category.id}>
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{category.icon}</span>
                      <div>
                        <p className="font-medium">{category.name}</p>
                        <p className="text-xs text-gray-500">{category.description}</p>
                      </div>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Valor Total Necessário */}
          <div className="space-y-2">
            <Label htmlFor="targetAmount">Valor Total Necessário * (R$)</Label>
            <Input
              id="targetAmount"
              type="number"
              step="any"
              min="0"
              value={formData.targetAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, targetAmount: e.target.value }))}
              placeholder="Ex: 10000,00"
            />
          </div>

          {/* Valor Atual Guardado */}
          <div className="space-y-2">
            <Label htmlFor="currentAmount">Valor Atual Guardado (R$)</Label>
            <Input
              id="currentAmount"
              type="number"
              step="any"
              min="0"
              value={formData.currentAmount}
              onChange={(e) => setFormData(prev => ({ ...prev, currentAmount: e.target.value }))}
              placeholder="Ex: 2500,00"
            />
          </div>

          {/* Data Limite */}
          <div className="space-y-2">
            <Label htmlFor="deadline">Data Limite *</Label>
            <Input
              id="deadline"
              type="date"
              value={formData.deadline}
              onChange={(e) => setFormData(prev => ({ ...prev, deadline: e.target.value }))}
            />
          </div>

          {/* Descrição (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva mais detalhes sobre seu objetivo..."
              rows={3}
            />
          </div>

          {/* Informações da categoria selecionada */}
          {selectedCategory && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <h4 className="font-medium text-blue-900 mb-1">
                {selectedCategory.icon} {selectedCategory.name}
              </h4>
              <p className="text-sm text-blue-700">{selectedCategory.description}</p>
              
              {/* Preview do progresso */}
              {formData.targetAmount && formData.currentAmount && (
                <div className="mt-2">
                  <p className="text-xs text-blue-600 mb-1">Preview do progresso:</p>
                  <div className="w-full bg-blue-200 rounded-full h-2">
                    <div 
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ 
                        width: `${Math.min(100, (parseFloat(formData.currentAmount.replace(',', '.')) / parseFloat(formData.targetAmount.replace(',', '.'))) * 100)}%` 
                      }}
                    />
                  </div>
                  <p className="text-xs text-blue-600 mt-1">
                    {((parseFloat(formData.currentAmount.replace(',', '.')) || 0) / (parseFloat(formData.targetAmount.replace(',', '.')) || 1) * 100).toFixed(1)}% concluído
                  </p>
                </div>
              )}
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
            <Button type="submit" className="w-full sm:w-auto">
              <PlusCircle className="h-4 w-4 mr-2" />
              {editGoal ? 'Atualizar Objetivo' : 'Criar Objetivo'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
