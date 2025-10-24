import { useState } from 'react';
import { useBudget } from '../contexts/BudgetContext';
import { CategoryBudgetStatus } from '@shared/budget-types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Alert, AlertDescription } from './ui/alert';
import { 
  PlusCircle, 
  Wallet, 
  TrendingUp, 
  AlertTriangle, 
  CheckCircle,
  Edit2,
  Trash2,
  Target
} from 'lucide-react';
import BudgetCategoryForm from './BudgetCategoryForm';
import BudgetAllocationModal from './BudgetAllocationModal';
import BudgetMonthlySummary from './BudgetMonthlySummary';
import { useToast } from '../hooks/use-toast';
import { useBudgetNotifications } from '../hooks/useBudgetNotifications';

export default function BudgetDivision() {
  const {
    categories,
    summary,
    getCategoriesStatus,
    deleteCategory,
    initializeDefaultCategories
  } = useBudget();
  const { toast } = useToast();

  // Ativar notificações automáticas de orçamento
  useBudgetNotifications();
  
  const [selectedCategory, setSelectedCategory] = useState<CategoryBudgetStatus | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [showAllocationModal, setShowAllocationModal] = useState(false);
  const [showMonthlySummary, setShowMonthlySummary] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);

  const categoriesStatus = getCategoriesStatus();

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    if (confirm(`Tem certeza que deseja excluir a categoria "${categoryName}"? Todos os gastos relacionados também serão removidos.`)) {
      deleteCategory(categoryId);
      toast({
        title: "Categoria excluída",
        description: `A categoria "${categoryName}" foi removida com sucesso.`
      });
    }
  };

  const getStatusColor = (status: 'ok' | 'warning' | 'exceeded') => {
    switch (status) {
      case 'ok': return 'text-green-600 bg-green-50 border-green-200';
      case 'warning': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'exceeded': return 'text-red-600 bg-red-50 border-red-200';
    }
  };

  const getStatusIcon = (status: 'ok' | 'warning' | 'exceeded') => {
    switch (status) {
      case 'ok': return <CheckCircle className="h-4 w-4" />;
      case 'warning': return <AlertTriangle className="h-4 w-4" />;
      case 'exceeded': return <AlertTriangle className="h-4 w-4" />;
    }
  };

  // Inicializar categorias padrão se não houver nenhuma
  if (categories.length === 0) {
    return (
      <div className="space-y-6">
        <div className="text-center py-12">
          <Wallet className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            Organize seus gastos por categoria
          </h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Crie categorias para dividir seus gastos mensais e mantenha controle sobre seu orçamento.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={initializeDefaultCategories} className="gap-2">
              <Target className="h-4 w-4" />
              Usar Categorias Sugeridas
            </Button>
            <BudgetCategoryForm 
              open={showCategoryForm} 
              onOpenChange={setShowCategoryForm}
            >
              <Button variant="outline" className="gap-2">
                <PlusCircle className="h-4 w-4" />
                Criar Categoria Personalizada
              </Button>
            </BudgetCategoryForm>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header com resumo */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Divisão Financeira</h2>
          <p className="text-gray-600">Gerencie seu orçamento por categorias</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2">
          <BudgetAllocationModal
            open={showAllocationModal}
            onOpenChange={setShowAllocationModal}
          >
            <Button variant="outline" className="gap-2">
              <TrendingUp className="h-4 w-4" />
              Alocar Transações
            </Button>
          </BudgetAllocationModal>

          <BudgetCategoryForm
            open={showCategoryForm}
            onOpenChange={(open) => {
              setShowCategoryForm(open);
              if (!open) setEditingCategory(null);
            }}
            editCategory={editingCategory}
          >
            <Button className="gap-2">
              <PlusCircle className="h-4 w-4" />
              Nova Categoria
            </Button>
          </BudgetCategoryForm>
        </div>
      </div>

      {/* Resumo geral */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Orçamento Total</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {summary.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <Wallet className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Gasto no Mês</p>
                <p className="text-2xl font-bold text-gray-900">
                  R$ {summary.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <TrendingUp className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Restante</p>
                <p className={`text-2xl font-bold ${summary.totalRemaining >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  R$ {Math.abs(summary.totalRemaining).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </p>
              </div>
              <div className={`p-2 rounded-full ${summary.totalRemaining >= 0 ? 'bg-green-100' : 'bg-red-100'}`}>
                {summary.totalRemaining >= 0 ? 
                  <CheckCircle className="h-6 w-6 text-green-600" /> : 
                  <AlertTriangle className="h-6 w-6 text-red-600" />
                }
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">% Utilizado</p>
                <p className="text-2xl font-bold text-gray-900">
                  {summary.percentUsed.toFixed(1)}%
                </p>
              </div>
              <div className="w-12 h-12 relative">
                <Progress 
                  value={Math.min(100, summary.percentUsed)} 
                  className="h-2 w-full"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Alertas de estouro */}
      {summary.categoriesExceeded > 0 && (
        <Alert className="border-red-200 bg-red-50">
          <AlertTriangle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            <strong>{summary.categoriesExceeded}</strong> categor{summary.categoriesExceeded > 1 ? 'ias estouraram' : 'ia estourou'} o orçamento mensal!
          </AlertDescription>
        </Alert>
      )}

      {/* Resumo Mensal */}
      <BudgetMonthlySummary
        showDetails={showMonthlySummary}
        onToggleDetails={() => setShowMonthlySummary(!showMonthlySummary)}
      />

      {/* Lista de categorias */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categoriesStatus.map((categoryStatus) => (
          <Card key={categoryStatus.category.id} className={`border-l-4 ${getStatusColor(categoryStatus.status).split(' ')[2]}`}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-xl" style={{ color: categoryStatus.category.color }}>
                    {categoryStatus.category.icon}
                  </span>
                  <div>
                    <CardTitle className="text-lg">{categoryStatus.category.name}</CardTitle>
                    {categoryStatus.category.description && (
                      <CardDescription className="text-xs">
                        {categoryStatus.category.description}
                      </CardDescription>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => {
                      setEditingCategory(categoryStatus.category);
                      setShowCategoryForm(true);
                    }}
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                    onClick={() => handleDeleteCategory(categoryStatus.category.id, categoryStatus.category.name)}
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Orçamento:</span>
                <span className="font-medium">
                  R$ {categoryStatus.monthlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
              
              <div className="flex justify-between items-center text-sm">
                <span className="text-gray-600">Gasto:</span>
                <span className={`font-medium ${categoryStatus.status === 'exceeded' ? 'text-red-600' : 'text-gray-900'}`}>
                  R$ {categoryStatus.currentSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>

              <Progress 
                value={Math.min(100, categoryStatus.percentUsed)} 
                className="h-2"
              />

              <div className="flex justify-between items-center">
                <Badge variant="secondary" className={getStatusColor(categoryStatus.status)}>
                  {getStatusIcon(categoryStatus.status)}
                  <span className="ml-1">
                    {categoryStatus.percentUsed.toFixed(1)}%
                  </span>
                </Badge>
                
                <span className={`text-sm font-medium ${categoryStatus.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {categoryStatus.remainingBudget >= 0 ? 'Restam' : 'Estourou'} R$ {Math.abs(categoryStatus.remainingBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
