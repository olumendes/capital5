import { useState } from 'react';
import { useGoals } from '../contexts/GoalsContext';
import { getGoalCategory, GoalWithStatus } from '@shared/goal-types';
import { Button } from './ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from './ui/dropdown-menu';
import GoalForm from './GoalForm';
import GoalProjectionModal from './GoalProjectionModal';
import {
  PlusCircle,
  Target,
  CalendarDays,
  TrendingUp,
  Clock,
  CheckCircle,
  AlertTriangle,
  MoreVertical,
  Edit,
  Trash2,
  Plus,
  Minus,
  Calculator
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

type SortOption = 'deadline' | 'progress' | 'name' | 'target';

export default function GoalsTab() {
  const { 
    summary, 
    getGoalsWithStatus, 
    deleteGoal, 
    updateGoalAmount 
  } = useGoals();
  
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingGoal, setEditingGoal] = useState<GoalWithStatus | null>(null);
  const [sortBy, setSortBy] = useState<SortOption>('deadline');

  const goals = getGoalsWithStatus();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getStatusColor = (status: GoalWithStatus['status']) => {
    switch (status) {
      case 'concluido': return 'bg-green-100 text-green-800';
      case 'atrasado': return 'bg-red-100 text-red-800';
      default: return 'bg-blue-100 text-blue-800';
    }
  };

  const getStatusText = (status: GoalWithStatus['status']) => {
    switch (status) {
      case 'concluido': return 'Concluído';
      case 'atrasado': return 'Atrasado';
      default: return 'Em andamento';
    }
  };

  const getStatusIcon = (status: GoalWithStatus['status']) => {
    switch (status) {
      case 'concluido': return <CheckCircle className="h-4 w-4" />;
      case 'atrasado': return <AlertTriangle className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
    }
  };

  const sortedGoals = [...goals].sort((a, b) => {
    switch (sortBy) {
      case 'deadline':
        return new Date(a.deadline).getTime() - new Date(b.deadline).getTime();
      case 'progress':
        return b.progressPercent - a.progressPercent;
      case 'name':
        return a.name.localeCompare(b.name);
      case 'target':
        return b.targetAmount - a.targetAmount;
      default:
        return 0;
    }
  });

  const handleEditGoal = (goal: GoalWithStatus) => {
    setEditingGoal(goal);
  };

  const handleDeleteGoal = (goal: GoalWithStatus) => {
    if (confirm(`Tem certeza que deseja excluir o objetivo "${goal.name}"?`)) {
      deleteGoal(goal.id);
    }
  };

  const handleUpdateAmount = (goalId: string, increment: number) => {
    const goal = goals.find(g => g.id === goalId);
    if (goal) {
      const newAmount = Math.max(0, goal.currentAmount + increment);
      updateGoalAmount(goalId, newAmount);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Objetivos Financeiros</h2>
          <p className="text-gray-600">Defina e acompanhe seus objetivos de vida</p>
        </div>
        <GoalForm open={showAddForm} onOpenChange={setShowAddForm}>
          <Button className="w-full sm:w-auto">
            <PlusCircle className="h-4 w-4 mr-2" />
            Novo Objetivo
          </Button>
        </GoalForm>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total de Objetivos</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5" />
              {summary.totalGoals}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Concluídos</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              {summary.completedGoals}
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Progresso Médio</CardDescription>
            <CardTitle className="text-lg flex items-center gap-2 text-blue-600">
              <TrendingUp className="h-5 w-5" />
              {summary.averageProgress.toFixed(1)}%
            </CardTitle>
          </CardHeader>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Guardado</CardDescription>
            <CardTitle className="text-lg">
              {formatCurrency(summary.totalCurrentAmount)}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Controls */}
      {goals.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Ordenar por:</span>
            <Select value={sortBy} onValueChange={(value) => setSortBy(value as SortOption)}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="deadline">Data Limite</SelectItem>
                <SelectItem value="progress">Progresso</SelectItem>
                <SelectItem value="name">Nome</SelectItem>
                <SelectItem value="target">Valor</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      )}

      {/* Goals List */}
      {goals.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent>
            <Target className="h-12 w-12 mx-auto text-gray-400 mb-4" />
            <h3 className="text-lg font-medium mb-2">Nenhum objetivo cadastrado</h3>
            <p className="text-gray-600 mb-4">
              Comece definindo seus objetivos financeiros para acompanhar seu progresso
            </p>
            <GoalForm open={showAddForm} onOpenChange={setShowAddForm}>
              <Button>
                <PlusCircle className="h-4 w-4 mr-2" />
                Criar Primeiro Objetivo
              </Button>
            </GoalForm>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {sortedGoals.map((goal) => {
            const category = getGoalCategory(goal.category);
            
            return (
              <Card key={goal.id} className="relative">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-2 flex-1">
                      <span className="text-2xl">{category?.icon || '🎯'}</span>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-lg truncate">{goal.name}</CardTitle>
                        <CardDescription className="truncate">
                          {category?.name}
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
                        <GoalProjectionModal goal={goal}>
                          <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                            <Calculator className="h-4 w-4 mr-2" />
                            Projeção
                          </DropdownMenuItem>
                        </GoalProjectionModal>
                        <DropdownMenuItem onClick={() => handleEditGoal(goal)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Editar
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => handleDeleteGoal(goal)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Excluir
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-4">
                  {/* Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Status:</span>
                    <Badge className={getStatusColor(goal.status)}>
                      {getStatusIcon(goal.status)}
                      <span className="ml-1">{getStatusText(goal.status)}</span>
                    </Badge>
                  </div>
                  
                  {/* Progress */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Progresso:</span>
                      <span className="font-medium">{goal.progressPercent.toFixed(1)}%</span>
                    </div>
                    <Progress value={goal.progressPercent} className="h-2" />
                  </div>
                  
                  {/* Values */}
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Guardado:</span>
                      <span className="font-medium">{formatCurrency(goal.currentAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Objetivo:</span>
                      <span className="font-medium">{formatCurrency(goal.targetAmount)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Restante:</span>
                      <span className="font-medium text-orange-600">{formatCurrency(goal.remainingAmount)}</span>
                    </div>
                  </div>
                  
                  {/* Deadline */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Data limite:</span>
                    <span className={`font-medium ${goal.isOverdue ? 'text-red-600' : ''}`}>
                      {formatDate(goal.deadline)}
                    </span>
                  </div>
                  
                  {/* Days remaining */}
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Tempo restante:</span>
                    <span className={`font-medium ${goal.isOverdue ? 'text-red-600' : goal.daysRemaining < 30 ? 'text-orange-600' : ''}`}>
                      {goal.isOverdue
                        ? `${Math.abs(goal.daysRemaining)} dias atrasado`
                        : `${goal.daysRemaining} dias`
                      }
                    </span>
                  </div>

                  {/* Monthly savings needed */}
                  {!goal.isOverdue && goal.status !== 'concluido' && goal.monthlySavingsNeeded > 0 && (
                    <div className="bg-blue-50 border border-blue-200 rounded p-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-blue-800 font-medium">Guardar por mês:</span>
                        <span className="text-blue-900 font-bold">
                          {formatCurrency(goal.monthlySavingsNeeded)}
                        </span>
                      </div>
                      <p className="text-xs text-blue-600 mt-1">
                        Para atingir o objetivo em {goal.monthsRemaining} mês{goal.monthsRemaining !== 1 ? 'es' : ''}
                      </p>
                    </div>
                  )}
                  
                  {/* Actions */}
                  <div className="space-y-3 pt-2 border-t">
                    {/* Projection button for goals in progress */}
                    {goal.status !== 'concluido' && (
                      <GoalProjectionModal goal={goal}>
                        <Button variant="outline" size="sm" className="w-full">
                          <Calculator className="h-3 w-3 mr-2" />
                          Ver Projeção de Viabilidade
                        </Button>
                      </GoalProjectionModal>
                    )}

                    {/* Quick amount update */}
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-gray-600">Atualizar valor:</span>
                      <div className="flex items-center gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateAmount(goal.id, -100)}
                          disabled={goal.currentAmount <= 0}
                        >
                          <Minus className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleUpdateAmount(goal.id, 100)}
                        >
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Edit Goal Modal */}
      {editingGoal && (
        <GoalForm
          open={!!editingGoal}
          onOpenChange={(open) => !open && setEditingGoal(null)}
          editGoal={editingGoal}
        >
          <div />
        </GoalForm>
      )}
    </div>
  );
}
