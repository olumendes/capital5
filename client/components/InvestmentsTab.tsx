import { useState } from 'react';
import { useInvestments } from '../contexts/InvestmentContext';
import { getInvestmentOption } from '@shared/investment-types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import InvestmentForm from './InvestmentForm';
import { 
  PlusCircle, 
  RefreshCw, 
  TrendingUp, 
  TrendingDown, 
  Wallet,
  MoreVertical,
  Trash2,
  Edit
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function InvestmentsTab() {
  const { 
    investments, 
    summary, 
    updateQuotes, 
    isUpdatingQuotes, 
    deleteInvestment,
    lastQuoteUpdate 
  } = useInvestments();
  
  const [showAddForm, setShowAddForm] = useState(false);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`;
  };

  const getPerformanceColor = (percent: number) => {
    if (percent > 0) return 'text-green-600';
    if (percent < 0) return 'text-red-600';
    return 'text-gray-600';
  };

  const getPerformanceBadgeVariant = (percent: number) => {
    if (percent > 0) return 'default';
    if (percent < 0) return 'destructive';
    return 'secondary';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Investimentos</h2>
          <p className="text-gray-600">Acompanhe a rentabilidade dos seus investimentos</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <Button
            variant="outline"
            onClick={updateQuotes}
            disabled={isUpdatingQuotes}
            className="flex-1 sm:flex-initial"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isUpdatingQuotes ? 'animate-spin' : ''}`} />
            {isUpdatingQuotes ? 'Atualizando...' : 'Atualizar'}
          </Button>
          <InvestmentForm open={showAddForm} onOpenChange={setShowAddForm}>
            <Button className="flex-1 sm:flex-initial">
              <PlusCircle className="h-4 w-4 mr-2" />
              Adicionar
            </Button>
          </InvestmentForm>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Investido</CardDescription>
            <CardTitle className="text-lg">{formatCurrency(summary.totalInvested)}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Valor Atual</CardDescription>
            <CardTitle className="text-lg">{formatCurrency(summary.currentValue)}</CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Lucro/Prejuízo</CardDescription>
            <CardTitle className={`text-lg ${getPerformanceColor(summary.totalProfitLoss)}`}>
              {formatCurrency(summary.totalProfitLoss)}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Rentabilidade</CardDescription>
            <CardTitle className={`text-lg ${getPerformanceColor(summary.totalProfitLossPercent)}`}>
              {formatPercent(summary.totalProfitLossPercent)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Last Update Info */}
      {lastQuoteUpdate && (
        <div className="text-sm text-gray-500 text-center">
          Última atualização: {format(new Date(lastQuoteUpdate), "dd/MM/yyyy 'às' HH:mm", { locale: ptBR })}
        </div>
      )}

      {/* Investments List */}
      {investments.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Wallet className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum investimento cadastrado</h3>
            <p className="text-gray-600 mb-4">
              Comece adicionando seus primeiros investimentos para acompanhar a rentabilidade
            </p>
            <InvestmentForm open={showAddForm} onOpenChange={setShowAddForm}>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Adicionar Primeiro Investimento
              </Button>
            </InvestmentForm>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {investments.map((investment) => {
            const option = getInvestmentOption(investment.type);
            const profitLoss = investment.profitLoss || 0;
            const profitLossPercent = investment.profitLossPercent || 0;
            const currentValue = investment.currentValue || (investment.quantity * investment.purchasePrice);
            
            return (
              <Card key={investment.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-2xl">{option?.icon || '📈'}</span>
                      <div>
                        <CardTitle className="text-lg">
                          {investment.name || option?.name}
                        </CardTitle>
                        <CardDescription>
                          {investment.quantity} {option?.unit}
                        </CardDescription>
                      </div>
                    </div>
                    
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => deleteInvestment(investment.id)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-3">
                  {/* Current Value */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Valor Atual:</span>
                    <span className="font-medium">{formatCurrency(currentValue)}</span>
                  </div>
                  
                  {/* Purchase Info */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Investido:</span>
                    <span className="text-sm">{formatCurrency(investment.quantity * investment.purchasePrice)}</span>
                  </div>
                  
                  {/* Performance */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Performance:</span>
                      <div className="flex items-center gap-2">
                        <Badge variant={getPerformanceBadgeVariant(profitLossPercent)}>
                          {profitLossPercent >= 0 ? <TrendingUp className="h-3 w-3 mr-1" /> : <TrendingDown className="h-3 w-3 mr-1" />}
                          {formatPercent(profitLossPercent)}
                        </Badge>
                      </div>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Lucro/Prejuízo:</span>
                      <span className={`font-medium ${getPerformanceColor(profitLoss)}`}>
                        {formatCurrency(profitLoss)}
                      </span>
                    </div>
                  </div>
                  
                  {/* Current Price */}
                  {investment.currentPrice && (
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Preço Atual:</span>
                      <span className="text-sm">{formatCurrency(investment.currentPrice)} / {option?.unit}</span>
                    </div>
                  )}
                  
                  {/* Purchase Date */}
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Data Compra:</span>
                    <span className="text-sm">
                      {format(new Date(investment.purchaseDate), 'dd/MM/yyyy', { locale: ptBR })}
                    </span>
                  </div>

                  {/* Goal Allocations */}
                  {investment.goalAllocations && investment.goalAllocations.length > 0 && (
                    <div className="bg-orange-50 border border-orange-200 rounded p-2">
                      <p className="text-xs font-medium text-orange-800 mb-1">Alocado para objetivos:</p>
                      {investment.goalAllocations.map((allocation, index) => (
                        <div key={index} className="flex justify-between items-center text-xs text-orange-700">
                          <span className="truncate">{allocation.goalName}</span>
                          <span className="font-medium">{formatCurrency(allocation.allocatedAmount)}</span>
                        </div>
                      ))}
                      <div className="border-t border-orange-300 mt-1 pt-1">
                        <div className="flex justify-between items-center text-xs font-medium text-orange-800">
                          <span>Total alocado:</span>
                          <span>
                            {formatCurrency(
                              investment.goalAllocations.reduce((sum, alloc) => sum + alloc.allocatedAmount, 0)
                            )}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {/* Performance Progress Bar */}
                  <div className="space-y-1">
                    <div className="flex justify-between text-xs text-gray-500">
                      <span>Performance</span>
                      <span>{formatPercent(profitLossPercent)}</span>
                    </div>
                    <Progress 
                      value={Math.min(Math.max(profitLossPercent + 50, 0), 100)} 
                      className="h-2"
                    />
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Best/Worst Performers */}
      {investments.length > 1 && (summary.bestPerformer || summary.worstPerformer) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {summary.bestPerformer && (
            <Card className="border-green-200 bg-green-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-green-800 flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Melhor Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getInvestmentOption(summary.bestPerformer.type)?.icon}</span>
                  <div>
                    <p className="font-medium">{summary.bestPerformer.name}</p>
                    <p className="text-sm text-green-700">
                      {formatPercent(summary.bestPerformer.profitLossPercent || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
          
          {summary.worstPerformer && (
            <Card className="border-red-200 bg-red-50">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg text-red-800 flex items-center gap-2">
                  <TrendingDown className="h-5 w-5" />
                  Pior Performance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-2xl">{getInvestmentOption(summary.worstPerformer.type)?.icon}</span>
                  <div>
                    <p className="font-medium">{summary.worstPerformer.name}</p>
                    <p className="text-sm text-red-700">
                      {formatPercent(summary.worstPerformer.profitLossPercent || 0)}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      )}
    </div>
  );
}
