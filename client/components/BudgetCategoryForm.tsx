import { useState, useEffect } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { BudgetCategory, DEFAULT_BUDGET_CATEGORIES } from '@shared/budget-types';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Label } from './ui/label';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { PlusCircle, Wallet, Edit2 } from 'lucide-react';
import { useToast } from '../hooks/use-toast';

interface BudgetCategoryFormProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  editCategory?: BudgetCategory;
}

export default function BudgetCategoryForm({ children, open, onOpenChange, editCategory }: BudgetCategoryFormProps) {
  const { addCategory, updateCategory } = useBudget();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: editCategory?.name || '',
    monthlyLimit: editCategory?.monthlyLimit?.toString() || '',
    description: editCategory?.description || '',
    icon: editCategory?.icon || '💰',
    color: editCategory?.color || '#3b82f6'
  });

  // Atualizar o form quando editCategory mudar
  useEffect(() => {
    if (editCategory) {
      setFormData({
        name: editCategory.name,
        monthlyLimit: editCategory.monthlyLimit.toString(),
        description: editCategory.description || '',
        icon: editCategory.icon,
        color: editCategory.color
      });
    } else {
      setFormData({
        name: '',
        monthlyLimit: '',
        description: '',
        icon: '💰',
        color: '#3b82f6'
      });
    }
  }, [editCategory]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.monthlyLimit) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha o nome e o limite mensal",
        variant: "destructive"
      });
      return;
    }

    const monthlyLimit = parseFloat(formData.monthlyLimit.replace(',', '.'));

    if (isNaN(monthlyLimit) || monthlyLimit < 0) {
      toast({
        title: "Valor inválido",
        description: "O limite mensal deve ser um número positivo ou zero",
        variant: "destructive"
      });
      return;
    }

    const categoryData = {
      name: formData.name,
      monthlyLimit,
      description: formData.description || undefined,
      icon: formData.icon,
      color: formData.color
    };

    if (editCategory) {
      updateCategory({
        ...editCategory,
        ...categoryData
      });
      toast({
        title: "Categoria atualizada",
        description: "Categoria de orçamento atualizada com sucesso!"
      });
    } else {
      addCategory(categoryData);
      toast({
        title: "Categoria criada",
        description: "Nova categoria de orçamento criada com sucesso!"
      });
    }

    // Reset form
    setFormData({
      name: '',
      monthlyLimit: '',
      description: '',
      icon: '💰',
      color: '#3b82f6'
    });

    onOpenChange?.(false);
  };

  const selectDefaultCategory = (defaultCat: typeof DEFAULT_BUDGET_CATEGORIES[0]) => {
    setFormData(prev => ({
      ...prev,
      name: defaultCat.name,
      description: defaultCat.description,
      icon: defaultCat.icon,
      color: defaultCat.color
    }));
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Wallet className="h-5 w-5" />
            {editCategory ? 'Editar Categoria' : 'Nova Categoria de Orçamento'}
          </DialogTitle>
          <DialogDescription>
            {editCategory 
              ? 'Atualize as informações da categoria de orçamento' 
              : 'Crie uma nova categoria para organizar seus gastos mensais'
            }
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Categorias pré-definidas (apenas para nova categoria) */}
          {!editCategory && (
            <div className="space-y-2">
              <Label>Categorias Sugeridas</Label>
              <div className="grid grid-cols-2 gap-2">
                {DEFAULT_BUDGET_CATEGORIES.slice(0, 6).map((cat, index) => (
                  <Button
                    key={index}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-auto p-2 justify-start"
                    onClick={() => selectDefaultCategory(cat)}
                  >
                    <span className="mr-2">{cat.icon}</span>
                    <span className="text-xs">{cat.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Nome da Categoria */}
          <div className="space-y-2">
            <Label htmlFor="name">Nome da Categoria *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
              placeholder="Ex: Alimentação, Transporte..."
            />
          </div>

          {/* Ícone e Cor */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="icon">Ícone</Label>
              <Input
                id="icon"
                value={formData.icon}
                onChange={(e) => setFormData(prev => ({ ...prev, icon: e.target.value }))}
                placeholder="🍽️"
                className="text-center text-xl"
                maxLength={2}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="color">Cor</Label>
              <Input
                id="color"
                type="color"
                value={formData.color}
                onChange={(e) => setFormData(prev => ({ ...prev, color: e.target.value }))}
                className="h-10 w-full"
              />
            </div>
          </div>

          {/* Limite Mensal */}
          <div className="space-y-2">
            <Label htmlFor="monthlyLimit">Limite Mensal * (R$)</Label>
            <Input
              id="monthlyLimit"
              type="number"
              step="any"
              min="0"
              value={formData.monthlyLimit}
              onChange={(e) => setFormData(prev => ({ ...prev, monthlyLimit: e.target.value }))}
              placeholder="Ex: 800,00"
            />
          </div>

          {/* Descrição (opcional) */}
          <div className="space-y-2">
            <Label htmlFor="description">Descrição (opcional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
              placeholder="Descreva que tipo de gastos entram nesta categoria..."
              rows={3}
            />
          </div>

          {/* Preview da categoria */}
          {formData.name && formData.monthlyLimit && (
            <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <h4 className="font-medium text-gray-900 mb-1 flex items-center gap-2">
                <span style={{ color: formData.color }}>{formData.icon}</span>
                {formData.name}
              </h4>
              <p className="text-sm text-gray-600 mb-2">
                Limite: R$ {parseFloat(formData.monthlyLimit.replace(',', '.') || '0').toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </p>
              {formData.description && (
                <p className="text-xs text-gray-500">{formData.description}</p>
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
              {editCategory ? <Edit2 className="h-4 w-4 mr-2" /> : <PlusCircle className="h-4 w-4 mr-2" />}
              {editCategory ? 'Atualizar Categoria' : 'Criar Categoria'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
