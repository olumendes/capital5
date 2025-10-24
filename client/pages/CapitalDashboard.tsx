import { useState, useMemo } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { useFinancialSummary } from '../hooks/useFinancialSummary';
import { useAuth } from '../contexts/AuthContext';
import { useChartData } from '../hooks/useChartData';
import { useOpenFinance } from '../hooks/useOpenFinance';
import { useProductionMode } from '../hooks/useProductionMode';
import { useGoals } from '../contexts/GoalsContext';
import { loadSampleData } from '../utils/sampleData';
import { createTestCSVFile, createTestNubankCSVFile, createTestRecargaPayCSVFile } from '../utils/testImportData';
import { useImport } from '../hooks/useImport';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Label } from '../components/ui/label';
import { Calendar } from '../components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '../components/ui/popover';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import TransactionModal from '../components/TransactionModal';
import TransactionList from '../components/TransactionList';
import ExportModal from '../components/ExportModal';
import ImportModal from '../components/ImportModal';
import OpenFinanceManager from '../components/OpenFinanceManager';
import InvestmentsTab from '../components/InvestmentsTab';
import GoalsTab from '../components/GoalsTab';
import GoalAllocationModal from '../components/GoalAllocationModal';
import CategoryModal from '../components/CategoryModal';
import BudgetDivision from '../components/BudgetDivision';
import ExpensePieChart from '../components/charts/ExpensePieChart';
import MonthlyBarChart from '../components/charts/MonthlyBarChart';
import TrendLineChart from '../components/charts/TrendLineChart';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  PlusCircle,
  Download,
  Filter,
  CreditCard,
  Building2,
  Target,
  AlertTriangle,
  CalendarIcon,
  Settings,
  Globe,
  Shield,
  ArrowRight,
  Trash2
} from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string;
  change?: number;
  icon: React.ReactNode;
  trend?: 'up' | 'down' | 'neutral';
}

function DashboardCard({ title, value, change, icon, trend = 'neutral' }: DashboardCardProps) {
  const getTrendColor = () => {
    if (trend === 'up') return 'text-green-600';
    if (trend === 'down') return 'text-red-600';
    return 'text-gray-600';
  };

  const getTrendIcon = () => {
    if (trend === 'up') return <TrendingUp className="h-3 w-3 sm:h-4 sm:w-4" />;
    if (trend === 'down') return <TrendingDown className="h-3 w-3 sm:h-4 sm:w-4" />;
    return null;
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
        <CardTitle className="text-xs sm:text-sm font-medium leading-tight">{title}</CardTitle>
        <div className="h-4 w-4 text-muted-foreground shrink-0">
          {icon}
        </div>
      </CardHeader>
      <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
        <div className="text-lg sm:text-2xl font-bold break-all">{value}</div>
        {change !== undefined && (
          <div className={`flex items-center text-xs ${getTrendColor()} mt-1`}>
            {getTrendIcon()}
            <span className="ml-1 truncate">
              <span className="hidden sm:inline">
                {change > 0 ? '+' : ''}{change.toFixed(1)}% vs mês anterior
              </span>
              <span className="sm:hidden">
                {change > 0 ? '+' : ''}{change.toFixed(1)}%
              </span>
            </span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

interface RecentTransactionProps {
  description: string;
  amount: number;
  category: string;
  date: string;
  type: 'receita' | 'despesa';
}

function RecentTransaction({ description, amount, category, date, type }: RecentTransactionProps) {
  const formattedAmount = new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(amount);

  const formattedDate = new Intl.DateTimeFormat('pt-BR', {
    day: '2-digit',
    month: '2-digit'
  }).format(new Date(date));

  return (
    <div className="flex items-center justify-between p-3 rounded-lg hover:bg-gray-50">
      <div className="flex-1">
        <p className="text-sm font-medium">{description}</p>
        <div className="flex items-center gap-2 mt-1">
          <Badge variant="secondary" className="text-xs">
            {category}
          </Badge>
          <span className="text-xs text-gray-500">{formattedDate}</span>
        </div>
      </div>
      <div className={`text-sm font-medium ${
        type === 'receita' ? 'text-green-600' : 'text-red-600'
      }`}>
        {type === 'receita' ? '+' : '-'}{formattedAmount}
      </div>
    </div>
  );
}

export default function CapitalDashboard() {
  const { transactions, categories, getFilteredTransactions, addTransaction, deleteCategory, filters, setFilters, fgtsBalance, setFGTSBalance } = useFinancial();
  const summary = useFinancialSummary();
  const { expenseDistribution, monthlyEvolution, expenseTrend, revenueTrend } = useChartData();
  const { importFile } = useImport();
  const { getEnvironmentInfo } = useOpenFinance();
  const environmentInfo = getEnvironmentInfo();
  const { isProductionMode, toggleProductionMode, isLoading: isLoadingProductionMode } = useProductionMode();
  const { summary: goalsSummary } = useGoals();
  const { user, logout } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [receitaModalOpen, setReceitaModalOpen] = useState(false);
  const [despesaModalOpen, setDespesaModalOpen] = useState(false);
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [importModalOpen, setImportModalOpen] = useState(false);
  const [openFinanceModalOpen, setOpenFinanceModalOpen] = useState(false);
  const [goalAllocationModalOpen, setGoalAllocationModalOpen] = useState(false);
  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [loadingExample, setLoadingExample] = useState(false);
  const [testingImport, setTestingImport] = useState(false);
  const [showCustomPeriod, setShowCustomPeriod] = useState(false);
  const [customStartDate, setCustomStartDate] = useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = useState<Date | undefined>();
  const [selectedMonth, setSelectedMonth] = useState<string>(''); // Para filtro de mês na visão geral

  const handleLoadSampleData = async () => {
    if (transactions.length > 0) {
      const confirmed = confirm('Isso irá adicionar dados de exemplo às suas transaç��es existentes. Continuar?');
      if (!confirmed) return;
    }

    setLoadingExample(true);
    const count = loadSampleData(addTransaction);

    // Simular um tempo de carregamento
    setTimeout(() => {
      setLoadingExample(false);
      alert(`${count} transações de exemplo foram adicionadas com sucesso!`);
    }, count * 10 + 500);
  };

  const handleTestImport = async () => {
    setTestingImport(true);
    try {
      const testFile = createTestCSVFile();
      const result = await importFile(testFile, 'generic');

      if (result.success) {
        alert(`✅ Teste de importação bem-sucedido!\n${result.message}`);
      } else {
        alert(`�� Erro no teste de importação:\n${result.message}`);
      }
    } catch (error) {
      alert(`❌ Erro inesperado no teste: ${error}`);
    } finally {
      setTestingImport(false);
    }
  };

  const handleTestNubankImport = async () => {
    setTestingImport(true);
    try {
      const testFile = createTestNubankCSVFile();
      const result = await importFile(testFile, 'nubank');

      if (result.success) {
        alert(`✅ Teste Nubank bem-sucedido!\n${result.message}`);
      } else {
        alert(`❌ Erro no teste Nubank:\n${result.message}`);
      }
    } catch (error) {
      alert(`❌ Erro inesperado no teste Nubank: ${error}`);
    } finally {
      setTestingImport(false);
    }
  };

  const handleTestRecargaPayImport = async () => {
    setTestingImport(true);
    try {
      const testFile = createTestRecargaPayCSVFile();
      const result = await importFile(testFile, 'recargapay');

      if (result.success) {
        alert(`✅ Teste RecargaPay bem-sucedido!\n${result.message}`);
      } else {
        alert(`❌ Erro no teste RecargaPay:\n${result.message}`);
      }
    } catch (error) {
      alert(`❌ Erro inesperado no teste RecargaPay: ${error}`);
    } finally {
      setTestingImport(false);
    }
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const handleDeleteCategory = (categoryId: string, categoryName: string) => {
    // Verificar se pode deletar antes de pedir confirmação
    const isUsed = transactions.some(t => t.category === categoryId);
    const isDefault = ['salario', 'freelance', 'investimentos', 'outros-receitas', 'alimentacao', 'transporte', 'moradia', 'saude', 'educacao', 'entretenimento', 'compras', 'servicos', 'outros-despesas'].includes(categoryId);

    if (isUsed) {
      alert(`Não é possível deletar a categoria "${categoryName}" pois ela está sendo usada em uma ou mais transações.`);
      return;
    }

    if (isDefault) {
      alert(`Não é possível deletar a categoria "${categoryName}" pois é uma categoria padrão do sistema.`);
      return;
    }

    if (confirm(`Tem certeza que deseja deletar a categoria "${categoryName}"?`)) {
      const deleted = deleteCategory(categoryId);
      if (deleted) {
        alert(`Categoria "${categoryName}" deletada com sucesso!`);
      }
    }
  };

  const recentTransactions = getFilteredTransactions().slice(0, 5);

  const getSaldoTrend = () => {
    if (summary.saldoAtual > 0) return 'up';
    if (summary.saldoAtual < 0) return 'down';
    return 'neutral';
  };

  const getVariacaoTrend = () => {
    if (summary.variacaoMensal > 0) return 'down'; // Aumento nos gastos é ruim
    if (summary.variacaoMensal < 0) return 'up'; // Diminuição nos gastos é bom
    return 'neutral';
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center">
              <div className="flex items-center gap-2 sm:gap-3">
                <div className="h-7 w-7 sm:h-8 sm:w-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <Wallet className="h-4 w-4 sm:h-5 sm:w-5 text-white" />
                </div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-900">Capital</h1>
                <Badge variant="secondary" className="text-xs">Beta</Badge>
              </div>
            </div>
            <div className="flex items-center gap-1 sm:gap-3">
              <Button
                variant={showCustomPeriod ? "default" : "outline"}
                size="sm"
                className="hidden sm:flex"
                onClick={() => setShowCustomPeriod(!showCustomPeriod)}
              >
                <Filter className="h-4 w-4 mr-2" />
                Filtros
              </Button>
              <ExportModal
                open={exportModalOpen}
                onOpenChange={setExportModalOpen}
              >
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Exportar</span>
                </Button>
              </ExportModal>
              <TransactionModal
                open={transactionModalOpen}
                onOpenChange={setTransactionModalOpen}
              >
                <Button size="sm">
                  <PlusCircle className="h-4 w-4 sm:mr-2" />
                  <span className="hidden sm:inline">Nova Transação</span>
                </Button>
              </TransactionModal>
              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                title={`Sair (${user?.email})`}
              >
                👤 <span className="hidden sm:inline">{user?.name || 'Sair'}</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 sm:space-y-6">
          <TabsList className="grid w-full grid-cols-7 h-auto">
            <TabsTrigger value="overview" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Visão Geral</span>
              <span className="sm:hidden">Geral</span>
            </TabsTrigger>
            <TabsTrigger value="transactions" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Transações</span>
              <span className="sm:hidden">Trans.</span>
            </TabsTrigger>
            <TabsTrigger value="budget" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Divisão Financeira</span>
              <span className="sm:hidden">Divisão</span>
            </TabsTrigger>
            <TabsTrigger value="investments" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Investimentos</span>
              <span className="sm:hidden">Invest.</span>
            </TabsTrigger>
            <TabsTrigger value="goals" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Objetivos</span>
              <span className="sm:hidden">Metas</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Análises</span>
              <span className="sm:hidden">Análises</span>
            </TabsTrigger>
            <TabsTrigger value="settings" className="text-xs sm:text-sm px-1 sm:px-3 py-2">
              <span className="hidden sm:inline">Configurações</span>
              <span className="sm:hidden">Config</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2 sm:gap-4">
              <DashboardCard
                title="Saldo Mês Atual"
                value={formatCurrency(summary.availableBalanceMonth)}
                icon={<Wallet />}
                trend={getSaldoTrend()}
              />
              <DashboardCard
                title="Saldo Total"
                value={formatCurrency(summary.availableBalanceTotal)}
                icon={<Building2 />}
                trend={summary.availableBalanceTotal > 0 ? 'up' : summary.availableBalanceTotal < 0 ? 'down' : 'neutral'}
              />
              <DashboardCard
                title="Receitas do Mês"
                value={formatCurrency(summary.totalReceitas)}
                icon={<TrendingUp />}
                trend="up"
              />
              <DashboardCard
                title="Despesas do Mês"
                value={formatCurrency(summary.totalDespesas)}
                change={summary.variacaoMensal}
                icon={<TrendingDown />}
                trend={getVariacaoTrend()}
              />
              <DashboardCard
                title="Investimentos"
                value={formatCurrency(summary.investmentValue || 0)}
                icon={<Target />}
              />
              <DashboardCard
                title="Objetivos"
                value={`${goalsSummary.completedGoals}/${goalsSummary.totalGoals}`}
                icon={<Target />}
              />
              <DashboardCard
                title="Transações"
                value={transactions.length.toString()}
                icon={<CreditCard />}
              />
              <DashboardCard
                title="Saldo FGTS"
                value={formatCurrency(fgtsBalance)}
                icon={<Building2 />}
              />
              <DashboardCard
                title="Total c/ FGTS"
                value={formatCurrency(summary.availableBalanceTotal + fgtsBalance)}
                icon={<Wallet />}
                trend={summary.availableBalanceTotal + fgtsBalance > 0 ? 'up' : summary.availableBalanceTotal + fgtsBalance < 0 ? 'down' : 'neutral'}
              />
            </div>

            {/* Indicador de Filtros Ativos */}
            {(filters.startDate || filters.endDate) && (
              <Card className="border-blue-200 bg-blue-50">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Filter className="h-4 w-4 text-blue-600" />
                      <span className="text-sm font-medium text-blue-800">
                        Filtros aplicados:
                        {filters.startDate && ` De ${format(new Date(filters.startDate), 'dd/MM/yyyy', { locale: ptBR })}`}
                        {filters.endDate && ` até ${format(new Date(filters.endDate), 'dd/MM/yyyy', { locale: ptBR })}`}
                        <span className="text-xs text-blue-600 ml-2">
                          ({getFilteredTransactions().length} transações)
                        </span>
                      </span>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setFilters({ ...filters, startDate: undefined, endDate: undefined })}
                    >
                      Limpar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Filtros Rápidos */}
            {showCustomPeriod && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Filtros Rápidos</CardTitle>
                  <CardDescription>
                    Filtre as transações por período específico
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3">
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const now = new Date();
                        const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                        setFilters({
                          ...filters,
                          startDate: startOfMonth.toISOString().split('T')[0],
                          endDate: now.toISOString().split('T')[0]
                        });
                      }}
                    >
                      📅 Mês Atual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const now = new Date();
                        const last30Days = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        setFilters({
                          ...filters,
                          startDate: last30Days.toISOString().split('T')[0],
                          endDate: now.toISOString().split('T')[0]
                        });
                      }}
                    >
                      📊 Últimos 30 Dias
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        setFilters({
                          ...filters,
                          startDate: undefined,
                          endDate: undefined
                        });
                      }}
                    >
                      🔄 Limpar Filtros
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const now = new Date();
                        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                        setFilters({
                          ...filters,
                          startDate: lastMonth.toISOString().split('T')[0],
                          endDate: endLastMonth.toISOString().split('T')[0]
                        });
                      }}
                    >
                      📆 Mês Anterior
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => {
                        const now = new Date();
                        const startOfYear = new Date(now.getFullYear(), 0, 1);
                        setFilters({
                          ...filters,
                          startDate: startOfYear.toISOString().split('T')[0],
                          endDate: now.toISOString().split('T')[0]
                        });
                      }}
                    >
                      📅 Ano Atual
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="justify-start"
                      onClick={() => setShowCustomPeriod(false)}
                    >
                      ❌ Fechar
                    </Button>
                  </div>

                  {/* Período Personalizado */}
                  <div className="mt-4 pt-4 border-t">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      🗓️ Período Personalizado
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customStartDate ?
                                format(customStartDate, 'dd/MM/yyyy', { locale: ptBR }) :
                                'Selecionar data inicial'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              locale={ptBR}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customEndDate ?
                                format(customEndDate, 'dd/MM/yyyy', { locale: ptBR }) :
                                'Selecionar data final'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              locale={ptBR}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            setFilters({
                              ...filters,
                              startDate: customStartDate.toISOString().split('T')[0],
                              endDate: customEndDate.toISOString().split('T')[0]
                            });
                          }
                        }}
                        disabled={!customStartDate || !customEndDate}
                        className="flex-1"
                      >
                        Aplicar Período
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCustomStartDate(undefined);
                          setCustomEndDate(undefined);
                        }}
                      >
                        🔄 Limpar Datas
                      </Button>
                    </div>

                    {/* Preview do período */}
                    {customStartDate && customEndDate && (
                      <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                        <p className="text-sm text-blue-800">
                          📊 <strong>Período selecionado:</strong>
                          {format(customStartDate, 'dd/MM/yyyy', { locale: ptBR })} até {format(customEndDate, 'dd/MM/yyyy', { locale: ptBR })}
                          <br />
                          <span className="text-xs text-blue-600">
                            ({Math.ceil((customEndDate.getTime() - customStartDate.getTime()) / (1000 * 60 * 60 * 24))} dias)
                          </span>
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Main Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
              {/* Recent Transactions */}
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Transações Recentes</CardTitle>
                  <CardDescription>
                    Suas últimas movimentações financeiras
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {recentTransactions.length > 0 ? (
                    recentTransactions.map((transaction) => (
                      <RecentTransaction
                        key={transaction.id}
                        description={transaction.description}
                        amount={transaction.amount}
                        category={transaction.categoryName || transaction.category}
                        date={transaction.date}
                        type={transaction.type}
                      />
                    ))
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p>Nenhuma transação encontrada</p>
                      <p className="text-sm">Adicione sua primeira transação para começar</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Quick Actions & Summary */}
              <div className="space-y-6">
                {/* Quick Actions */}
                <Card>
                  <CardHeader>
                    <CardTitle>Ações Rápidas</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <TransactionModal
                      initialType="receita"
                      open={receitaModalOpen}
                      onOpenChange={setReceitaModalOpen}
                    >
                      <Button className="w-full justify-start" variant="outline">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Receita
                      </Button>
                    </TransactionModal>
                    <TransactionModal
                      initialType="despesa"
                      open={despesaModalOpen}
                      onOpenChange={setDespesaModalOpen}
                    >
                      <Button className="w-full justify-start" variant="outline">
                        <PlusCircle className="h-4 w-4 mr-2" />
                        Adicionar Despesa
                      </Button>
                    </TransactionModal>

                    <GoalAllocationModal
                      open={goalAllocationModalOpen}
                      onOpenChange={setGoalAllocationModalOpen}
                    >
                      <Button className="w-full justify-start" variant="outline">
                        <TrendingDown className="h-4 w-4 mr-2" />
                        Lançar para Objetivo
                      </Button>
                    </GoalAllocationModal>
                    <OpenFinanceManager
                      open={openFinanceModalOpen}
                      onOpenChange={setOpenFinanceModalOpen}
                    >
                      <Button className="w-full justify-start" variant="outline">
                        <Building2 className="h-4 w-4 mr-2" />
                        Open Finance
                      </Button>
                    </OpenFinanceManager>
                    <ImportModal
                      open={importModalOpen}
                      onOpenChange={setImportModalOpen}
                    >
                      <Button className="w-full justify-start" variant="outline">
                        <Download className="h-4 w-4 mr-2" />
                        Importar Dados
                      </Button>
                    </ImportModal>
                    {transactions.length === 0 && (
                      <>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={handleLoadSampleData}
                          disabled={loadingExample}
                        >
                          <Target className="h-4 w-4 mr-2" />
                          {loadingExample ? 'Carregando...' : 'Carregar Dados de Exemplo'}
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={handleTestImport}
                          disabled={testingImport}
                        >
                          <Download className="h-4 w-4 mr-2" />
                          {testingImport ? 'Testando...' : 'Testar CSV Genérico'}
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={handleTestNubankImport}
                          disabled={testingImport}
                        >
                          💜
                          {testingImport ? 'Testando...' : 'Testar CSV Nubank'}
                        </Button>
                        <Button
                          className="w-full justify-start"
                          variant="outline"
                          onClick={handleTestRecargaPayImport}
                          disabled={testingImport}
                        >
                          🔷
                          {testingImport ? 'Testando...' : 'Testar CSV RecargaPay'}
                        </Button>
                      </>
                    )}
                  </CardContent>
                </Card>

                {/* Top Categories */}
                <Card>
                  <CardHeader>
                    <CardTitle>Maiores Gastos</CardTitle>
                    <CardDescription>Por categoria este mês</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {summary.maioresGastos.length > 0 ? (
                      summary.maioresGastos.map((gasto, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 bg-blue-600 rounded-full"></div>
                            <span className="text-sm">{gasto.category}</span>
                          </div>
                          <div className="text-right">
                            <div className="text-sm font-medium">
                              {formatCurrency(gasto.amount)}
                            </div>
                            <div className="text-xs text-gray-500">
                              {gasto.percentage.toFixed(1)}%
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        <Target className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="text-sm">Nenhum gasto registrado</p>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Alerts */}
                {summary.variacaoMensal > 20 && (
                  <Card className="border-orange-200 bg-orange-50">
                    <CardHeader>
                      <CardTitle className="text-orange-800 flex items-center gap-2">
                        <AlertTriangle className="h-4 w-4" />
                        Alerta de Gastos
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-orange-700">
                        Seus gastos aumentaram {summary.variacaoMensal.toFixed(1)}% 
                        em relação ao mês passado. Considere revisar seu orçamento.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="transactions">
            <TransactionList />
          </TabsContent>

          <TabsContent value="budget">
            <BudgetDivision />
          </TabsContent>

          <TabsContent value="investments">
            <InvestmentsTab />
          </TabsContent>

          <TabsContent value="goals">
            <GoalsTab />
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            {/* Filtros de Período */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Filtros de Análise</CardTitle>
                <CardDescription>
                  Personalize o período para suas análises financeiras
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const now = new Date();
                      const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
                      setFilters({
                        ...filters,
                        startDate: startOfMonth.toISOString().split('T')[0],
                        endDate: now.toISOString().split('T')[0]
                      });
                    }}
                  >
                    📅 Mês Atual
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const now = new Date();
                      const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);
                      const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0);
                      setFilters({
                        ...filters,
                        startDate: lastMonth.toISOString().split('T')[0],
                        endDate: endLastMonth.toISOString().split('T')[0]
                      });
                    }}
                  >
                    📅 Mês Anterior
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => {
                      const now = new Date();
                      const threeMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 2, 1);
                      setFilters({
                        ...filters,
                        startDate: threeMonthsAgo.toISOString().split('T')[0],
                        endDate: now.toISOString().split('T')[0]
                      });
                    }}
                  >
                    📅 Últimos 3 Meses
                  </Button>
                  <Button
                    variant="outline"
                    className="justify-start"
                    onClick={() => setShowCustomPeriod(!showCustomPeriod)}
                  >
                    🗓️ Período Personalizado
                  </Button>
                </div>

                {/* Período Personalizado */}
                {showCustomPeriod && (
                  <div className="mt-4 p-4 border rounded-lg bg-gray-50">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Data Início</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customStartDate ?
                                format(customStartDate, 'dd/MM/yyyy', { locale: ptBR }) :
                                'Selecionar data inicial'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={customStartDate}
                              onSelect={setCustomStartDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>

                      <div className="space-y-2">
                        <Label>Data Fim</Label>
                        <Popover>
                          <PopoverTrigger asChild>
                            <Button variant="outline" className="w-full justify-start text-left">
                              <CalendarIcon className="mr-2 h-4 w-4" />
                              {customEndDate ?
                                format(customEndDate, 'dd/MM/yyyy', { locale: ptBR }) :
                                'Selecionar data final'
                              }
                            </Button>
                          </PopoverTrigger>
                          <PopoverContent className="w-auto p-0">
                            <Calendar
                              mode="single"
                              selected={customEndDate}
                              onSelect={setCustomEndDate}
                              initialFocus
                            />
                          </PopoverContent>
                        </Popover>
                      </div>
                    </div>

                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => {
                          if (customStartDate && customEndDate) {
                            setFilters({
                              ...filters,
                              startDate: customStartDate.toISOString().split('T')[0],
                              endDate: customEndDate.toISOString().split('T')[0]
                            });
                          }
                        }}
                        disabled={!customStartDate || !customEndDate}
                      >
                        Aplicar Período
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => {
                          setCustomStartDate(undefined);
                          setCustomEndDate(undefined);
                          setShowCustomPeriod(false);
                        }}
                      >
                        Cancelar
                      </Button>
                    </div>
                  </div>
                )}
                {(filters.startDate || filters.endDate) && (
                  <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-blue-800">
                        Período ativo: {filters.startDate ? new Date(filters.startDate).toLocaleDateString('pt-BR') : 'Início'} até {filters.endDate ? new Date(filters.endDate).toLocaleDateString('pt-BR') : 'Hoje'}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setFilters({ ...filters, startDate: undefined, endDate: undefined })}
                      >
                        Limpar
                      </Button>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Resumo de Análises */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Maior Categoria</CardTitle>
                </CardHeader>
                <CardContent>
                  {expenseDistribution.length > 0 ? (
                    <div>
                      <p className="text-2xl font-bold text-red-600">
                        {expenseDistribution[0].name}
                      </p>
                      <p className="text-sm text-gray-600">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(expenseDistribution[0].value)}
                      </p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Sem dados</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Média Mensal</CardTitle>
                </CardHeader>
                <CardContent>
                  {monthlyEvolution.length > 0 ? (
                    <div>
                      <p className="text-2xl font-bold">
                        {new Intl.NumberFormat('pt-BR', {
                          style: 'currency',
                          currency: 'BRL'
                        }).format(
                          monthlyEvolution.reduce((sum, month) => sum + month.despesas, 0) / monthlyEvolution.length
                        )}
                      </p>
                      <p className="text-sm text-gray-600">Despesas por mês</p>
                    </div>
                  ) : (
                    <p className="text-gray-500">Sem dados</p>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">Transações</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-2xl font-bold">{transactions.length}</p>
                  <p className="text-sm text-gray-600">Total registradas</p>
                </CardContent>
              </Card>
            </div>

            {/* Gráficos Principais */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ExpensePieChart data={expenseDistribution} />
              <MonthlyBarChart data={monthlyEvolution} />
            </div>

            {/* Gráficos de Tendência */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TrendLineChart
                data={expenseTrend}
                title="Tendência de Despesas"
                description="Evolução diária dos gastos"
                type="despesas"
              />
              <TrendLineChart
                data={revenueTrend}
                title="Tendência de Receitas"
                description="Evolução diária das receitas"
                type="receitas"
              />
            </div>

            {/* Insights e Alertas */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Insights Financeiros
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {expenseDistribution.length > 0 && (
                    <div className="p-3 bg-blue-50 rounded-lg">
                      <p className="text-sm">
                        <strong>{expenseDistribution[0].name}</strong> representa{' '}
                        <strong>{expenseDistribution[0].percentage.toFixed(1)}%</strong> dos seus gastos
                      </p>
                    </div>
                  )}

                  {monthlyEvolution.length > 1 && (
                    <div className="p-3 bg-green-50 rounded-lg">
                      <p className="text-sm">
                        {monthlyEvolution[monthlyEvolution.length - 1].saldo >
                         monthlyEvolution[monthlyEvolution.length - 2].saldo ? (
                          <>Seu saldo melhorou em relação ao mês anterior! 🎉</>
                        ) : (
                          <>Seu saldo diminuiu em relação ao mês anterior. 📉</>
                        )}
                      </p>
                    </div>
                  )}

                  {transactions.length < 10 && (
                    <div className="p-3 bg-yellow-50 rounded-lg">
                      <p className="text-sm">
                        Adicione mais transações para obter insights mais precisos
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Recomendações
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="p-3 bg-orange-50 rounded-lg">
                    <p className="text-sm font-medium">💡 Dica de Economia</p>
                    <p className="text-sm">
                      Considere definir metas de gastos para suas principais categorias
                    </p>
                  </div>

                  <div className="p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm font-medium">📊 Análise de Padr��es</p>
                    <p className="text-sm">
                      Exporte seus dados para análises mais detalhadas
                    </p>
                  </div>

                  <div className="p-3 bg-indigo-50 rounded-lg">
                    <p className="text-sm font-medium">🏦 Integração</p>
                    <p className="text-sm">
                      Conecte suas contas bancárias para automatizar o controle
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            {/* Ambiente de Produção */}
            <Card className={environmentInfo.isProduction ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {environmentInfo.isProduction ? <Globe className="h-5 w-5 text-green-600" /> : <Settings className="h-5 w-5 text-orange-600" />}
                  Ambiente de Produção
                </CardTitle>
                <CardDescription>
                  {environmentInfo.isProduction
                    ? "Sistema em modo produção - APIs reais ativas"
                    : "Sistema em modo desenvolvimento - usando dados simulados"
                  }
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Status do Open Finance</p>
                    <p className="text-sm text-gray-600">
                      {environmentInfo.isProduction
                        ? environmentInfo.hasCredentials
                          ? "✅ Configurado para produção com credenciais válidas"
                          : "���️ Produção detectada mas credenciais não configuradas"
                        : "�� Ambiente de desenvolvimento - usando simulação"
                      }
                    </p>
                  </div>
                  <Badge variant={environmentInfo.isProduction && environmentInfo.hasCredentials ? "default" : "secondary"}>
                    {environmentInfo.isProduction ? "Produção" : "Desenvolvimento"}
                  </Badge>
                </div>

                {environmentInfo.isProduction && !environmentInfo.hasCredentials && (
                  <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="h-5 w-5 text-yellow-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-yellow-800">Configuração Necessária</h4>
                        <p className="text-sm text-yellow-700 mt-1">
                          Para usar o Open Finance em produção, configure as variáveis de ambiente:
                        </p>
                        <ul className="text-xs text-yellow-600 mt-2 space-y-1">
                          <li>• VITE_OPEN_FINANCE_CLIENT_ID</li>
                          <li>• VITE_OPEN_FINANCE_CLIENT_SECRET</li>
                          <li>• VITE_OPEN_FINANCE_REDIRECT_URI</li>
                        </ul>
                        <p className="text-xs text-yellow-600 mt-2">
                          Consulte OPEN_FINANCE_SETUP.md para instruções detalhadas.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {environmentInfo.isProduction && environmentInfo.hasCredentials && (
                  <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex items-start gap-3">
                      <Shield className="h-5 w-5 text-green-600 mt-0.5" />
                      <div>
                        <h4 className="font-medium text-green-800">Ambiente Configurado</h4>
                        <p className="text-sm text-green-700 mt-1">
                          Sistema configurado para usar APIs reais do Open Finance Brasil.
                        </p>
                        <p className="text-xs text-green-600 mt-1">
                          Redirect URI: {environmentInfo.redirectUri}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Controle Manual do Ambiente */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start gap-3">
                    <Settings className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div className="flex-1">
                      <h4 className="font-medium text-blue-800">Controle Manual do Ambiente</h4>
                      <p className="text-sm text-blue-700 mt-1">
                        Force o modo produção independente do ambiente de deploy.
                      </p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-2">
                          <input
                            type="checkbox"
                            id="production-toggle"
                            checked={isProductionMode}
                            onChange={(e) => toggleProductionMode(e.target.checked)}
                            disabled={isLoadingProductionMode}
                            className="rounded border-gray-300"
                          />
                          <label htmlFor="production-toggle" className="text-sm font-medium text-blue-800">
                            Forçar Modo Produção
                          </label>
                        </div>
                        {isProductionMode && (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Produção Ativa
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-blue-600 mt-2">
                        ⚠️ Ativar isto fará o sistema usar APIs reais mesmo em desenvolvimento.
                        A página será recarregada ao alterar.
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Open Finance */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Open Finance
                </CardTitle>
                <CardDescription>
                  Conecte suas contas bancárias para importação automática
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Conexões Bancárias</p>
                    <p className="text-sm text-gray-600">
                      Conecte Nubank, Inter, RecargaPay e outros bancos
                    </p>
                  </div>
                  <OpenFinanceManager
                    open={openFinanceModalOpen}
                    onOpenChange={setOpenFinanceModalOpen}
                  >
                    <Button>
                      <Building2 className="h-4 w-4 mr-2" />
                      Gerenciar Conexões
                    </Button>
                  </OpenFinanceManager>
                </div>
              </CardContent>
            </Card>

            {/* Gerenciamento FGTS */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="h-5 w-5" />
                  Saldo FGTS
                </CardTitle>
                <CardDescription>
                  Gerencie seu saldo de FGTS separado do saldo total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="fgts-balance">Saldo FGTS Atual</Label>
                  <div className="flex gap-2">
                    <input
                      id="fgts-balance"
                      type="number"
                      step="0.01"
                      value={fgtsBalance}
                      onChange={(e) => setFGTSBalance(parseFloat(e.target.value) || 0)}
                      className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      placeholder="0.00"
                    />
                    <span className="flex items-center text-2xl font-bold text-green-600">
                      {new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(fgtsBalance)}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  O saldo FGTS é mantido separado do saldo total e pode ser alocado para objetivos.
                </p>
              </CardContent>
            </Card>

            {/* Importação e Exportação */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Download className="h-5 w-5" />
                  Importação e Exportação
                </CardTitle>
                <CardDescription>
                  Gerencie seus dados financeiros
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Importar Transações</p>
                    <p className="text-sm text-gray-600">
                      CSV do Nubank, Inter, RecargaPay ou PDFs de faturas
                    </p>
                  </div>
                  <ImportModal
                    open={importModalOpen}
                    onOpenChange={setImportModalOpen}
                  >
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Importar
                    </Button>
                  </ImportModal>
                </div>

                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Exportar Dados</p>
                    <p className="text-sm text-gray-600">
                      Baixe relatórios em CSV, PDF ou backup em JSON
                    </p>
                  </div>
                  <ExportModal
                    open={exportModalOpen}
                    onOpenChange={setExportModalOpen}
                  >
                    <Button variant="outline">
                      <Download className="h-4 w-4 mr-2" />
                      Exportar
                    </Button>
                  </ExportModal>
                </div>
              </CardContent>
            </Card>

            {/* Categorias */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Categorias</CardTitle>
                    <CardDescription>
                      Gerencie as categorias de suas transações
                    </CardDescription>
                  </div>
                  <CategoryModal
                    open={categoryModalOpen}
                    onOpenChange={setCategoryModalOpen}
                  >
                    <Button>
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Nova Categoria
                    </Button>
                  </CategoryModal>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {categories.map((category) => {
                    const isDefault = ['salario', 'freelance', 'investimentos', 'outros-receitas', 'alimentacao', 'transporte', 'moradia', 'saude', 'educacao', 'entretenimento', 'compras', 'servicos', 'outros-despesas'].includes(category.id);
                    const isUsed = transactions.some(t => t.category === category.id);

                    return (
                      <div key={category.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{category.icon}</span>
                          <div>
                            <span className="text-sm font-medium">{category.name}</span>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant={category.type === 'receita' ? 'default' : 'secondary'} className="text-xs">
                                {category.type === 'receita' ? 'Receita' : 'Despesa'}
                              </Badge>
                              {isDefault && (
                                <Badge variant="outline" className="text-xs">
                                  Padrão
                                </Badge>
                              )}
                              {isUsed && (
                                <Badge variant="outline" className="text-xs text-green-600">
                                  Em uso
                                </Badge>
                              )}
                            </div>
                          </div>
                        </div>
                        {!isDefault && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteCategory(category.id, category.name)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Dados do Sistema */}
            <Card>
              <CardHeader>
                <CardTitle>Dados do Sistema</CardTitle>
                <CardDescription>
                  Informações sobre seus dados financeiros
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                  <div>
                    <p className="text-2xl font-bold text-blue-600">{transactions.length}</p>
                    <p className="text-sm text-gray-600">Transações</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-green-600">{categories.length}</p>
                    <p className="text-sm text-gray-600">Categorias</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-purple-600">
                      {transactions.filter(t => t.source === 'open-finance').length}
                    </p>
                    <p className="text-sm text-gray-600">Open Finance</p>
                  </div>
                  <div>
                    <p className="text-2xl font-bold text-orange-600">
                      {transactions.filter(t => t.source === 'importacao').length}
                    </p>
                    <p className="text-sm text-gray-600">Importadas</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
