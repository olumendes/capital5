import { useBudget } from '../contexts/BudgetContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Progress } from './ui/progress';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle,
  Calendar,
  Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

interface BudgetMonthlySummaryProps {
  showDetails?: boolean;
  onToggleDetails?: () => void;
}

export default function BudgetMonthlySummary({ showDetails = false, onToggleDetails }: BudgetMonthlySummaryProps) {
  const { getCategoriesStatus, getCurrentMonthExpenses, summary } = useBudget();
  
  const categoriesStatus = getCategoriesStatus();
  const monthlyExpenses = getCurrentMonthExpenses();
  const currentDate = new Date();

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

  return (
    <div className="space-y-6">
      {/* Header do Resumo */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Resumo de {format(currentDate, 'MMMM yyyy', { locale: ptBR })}
              </CardTitle>
              <CardDescription>
                Acompanhamento detalhado do seu orçamento mensal
              </CardDescription>
            </div>
            {onToggleDetails && (
              <Button 
                variant="outline" 
                size="sm" 
                onClick={onToggleDetails}
                className="gap-2"
              >
                <Eye className="h-4 w-4" />
                {showDetails ? 'Ocultar' : 'Ver'} Detalhes
              </Button>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Progresso Geral */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="font-medium">Progresso Geral do Orçamento</span>
              <span className={`font-bold ${summary.percentUsed > 100 ? 'text-red-600' : summary.percentUsed > 80 ? 'text-yellow-600' : 'text-green-600'}`}>
                {summary.percentUsed.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={Math.min(100, summary.percentUsed)} 
              className="h-3"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>R$ {summary.totalSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} gastos</span>
              <span>R$ {summary.totalBudget.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} orçamento</span>
            </div>
          </div>

          {/* Status das Categorias */}
          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">{summary.categoriesOk}</div>
              <div className="text-xs text-gray-500">No Limite</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">{summary.categoriesWarning}</div>
              <div className="text-xs text-gray-500">Atenção</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">{summary.categoriesExceeded}</div>
              <div className="text-xs text-gray-500">Estouradas</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Detalhes por Categoria */}
      {showDetails && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-900">Detalhes por Categoria</h3>
          
          {categoriesStatus.length === 0 ? (
            <Card>
              <CardContent className="text-center py-8">
                <div className="text-gray-500">Nenhuma categoria de orçamento criada</div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categoriesStatus.map((categoryStatus) => (
                <Card key={categoryStatus.category.id} className="relative">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="text-lg" style={{ color: categoryStatus.category.color }}>
                          {categoryStatus.category.icon}
                        </span>
                        <div>
                          <CardTitle className="text-base">{categoryStatus.category.name}</CardTitle>
                          <CardDescription className="text-xs">
                            {categoryStatus.expenses.length} transaç{categoryStatus.expenses.length !== 1 ? 'ões' : 'ão'}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="secondary" className={getStatusColor(categoryStatus.status)}>
                        {getStatusIcon(categoryStatus.status)}
                        <span className="ml-1">
                          {categoryStatus.percentUsed.toFixed(0)}%
                        </span>
                      </Badge>
                    </div>
                  </CardHeader>
                  
                  <CardContent className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Orçamento:</span>
                        <span className="font-medium">
                          R$ {categoryStatus.monthlyLimit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Gasto:</span>
                        <span className={`font-medium ${categoryStatus.status === 'exceeded' ? 'text-red-600' : 'text-gray-900'}`}>
                          R$ {categoryStatus.currentSpent.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Saldo:</span>
                        <span className={`font-medium ${categoryStatus.remainingBudget >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          R$ {Math.abs(categoryStatus.remainingBudget).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                      </div>
                    </div>
                    
                    <Progress 
                      value={Math.min(100, categoryStatus.percentUsed)} 
                      className="h-2"
                    />

                    {/* Lista de despesas recentes */}
                    {categoryStatus.expenses.length > 0 && (
                      <div className="space-y-1">
                        <div className="text-xs font-medium text-gray-600">Últimas despesas:</div>
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {categoryStatus.expenses.slice(0, 3).map((expense) => (
                            <div key={expense.id} className="flex justify-between text-xs bg-gray-50 rounded p-1">
                              <span className="truncate mr-2">{expense.description}</span>
                              <span className="font-medium text-red-600 shrink-0">
                                R$ {expense.amount.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                              </span>
                            </div>
                          ))}
                          {categoryStatus.expenses.length > 3 && (
                            <div className="text-xs text-gray-500 text-center">
                              +{categoryStatus.expenses.length - 3} mais
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
