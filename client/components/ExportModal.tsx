import { useState } from 'react';
import { useExport } from '../hooks/useExport';
import { useFinancial } from '../contexts/FinancialContext';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from './ui/dialog';
import { Button } from './ui/button';
import { Label } from './ui/label';
import { RadioGroup, RadioGroupItem } from './ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Calendar } from './ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from './ui/popover';
import { 
  Download, 
  FileText, 
  FileSpreadsheet, 
  FileCode,
  CalendarIcon,
  Filter
} from 'lucide-react';
import { format as formatDate } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { cn } from '../lib/utils';
import BackupInfo from './BackupInfo';

interface ExportModalProps {
  children: React.ReactNode;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

type ExportFormat = 'csv' | 'json' | 'pdf';
type ExportPeriod = 'all' | 'current-month' | 'last-month' | 'custom';

export default function ExportModal({ children, open, onOpenChange }: ExportModalProps) {
  const { exportData } = useExport();
  const { getFilteredTransactions, summary } = useFinancial();
  
  const [format, setFormat] = useState<ExportFormat>('csv');
  const [period, setPeriod] = useState<ExportPeriod>('current-month');
  const [startDate, setStartDate] = useState<Date>();
  const [endDate, setEndDate] = useState<Date>();
  const [isExporting, setIsExporting] = useState(false);

  const formatOptions = [
    {
      value: 'csv' as const,
      label: 'CSV (Excel)',
      description: 'Planilha de transações compatível com Excel, Google Sheets',
      icon: <FileSpreadsheet className="h-5 w-5" />,
      color: 'text-green-600'
    },
    {
      value: 'pdf' as const,
      label: 'PDF (Relatório)',
      description: 'Documento formatado para impressão',
      icon: <FileText className="h-5 w-5" />,
      color: 'text-red-600'
    },
    {
      value: 'json' as const,
      label: 'JSON (Backup Completo)',
      description: 'Backup completo: transações, objetivos, investimentos, orçamentos',
      icon: <FileCode className="h-5 w-5" />,
      color: 'text-blue-600'
    },
  ];

  const getTransactionsForExport = () => {
    const now = new Date();
    let filteredTransactions = getFilteredTransactions();

    switch (period) {
      case 'current-month':
        const currentMonth = now.getMonth();
        const currentYear = now.getFullYear();
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === currentMonth && 
                 transactionDate.getFullYear() === currentYear;
        });
        break;

      case 'last-month':
        const lastMonth = now.getMonth() === 0 ? 11 : now.getMonth() - 1;
        const lastMonthYear = now.getMonth() === 0 ? now.getFullYear() - 1 : now.getFullYear();
        filteredTransactions = filteredTransactions.filter(t => {
          const transactionDate = new Date(t.date);
          return transactionDate.getMonth() === lastMonth && 
                 transactionDate.getFullYear() === lastMonthYear;
        });
        break;

      case 'custom':
        if (startDate && endDate) {
          filteredTransactions = filteredTransactions.filter(t => {
            const transactionDate = new Date(t.date);
            return transactionDate >= startDate && transactionDate <= endDate;
          });
        }
        break;

      case 'all':
      default:
        // Usar todas as transações filtradas
        break;
    }

    return filteredTransactions;
  };

  const handleExport = async () => {
    setIsExporting(true);
    
    try {
      const transactions = getTransactionsForExport();
      
      if (transactions.length === 0) {
        alert('Nenhuma transação encontrada para o período selecionado');
        return;
      }

      exportData(format, transactions);
      
      // Fechar modal após sucesso
      onOpenChange?.(false);
    } catch (error) {
      console.error('Erro ao exportar:', error);
      alert('Erro ao exportar dados. Tente novamente.');
    } finally {
      setIsExporting(false);
    }
  };

  const getExportSummary = () => {
    const transactions = getTransactionsForExport();
    const receitas = transactions.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const despesas = transactions.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    
    return {
      total: transactions.length,
      receitas,
      despesas,
      saldo: receitas - despesas
    };
  };

  const exportSummary = getExportSummary();

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto mx-4 w-[calc(100vw-2rem)] sm:w-full">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-lg sm:text-xl">
            <Download className="h-5 w-5" />
            Exportar Dados
          </DialogTitle>
          <DialogDescription className="text-sm">
            Exporte suas transações em diferentes formatos para análise ou backup
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Info sobre backup completo */}
          <BackupInfo type="export" />

          {/* Formato de Exportação */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Formato de Exportação</Label>
            <RadioGroup value={format} onValueChange={(value: ExportFormat) => setFormat(value)}>
              {formatOptions.map((option) => (
                <Card key={option.value} className={cn(
                  "cursor-pointer transition-colors",
                  format === option.value ? "ring-2 ring-blue-500 bg-blue-50" : "hover:bg-gray-50"
                )}>
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value={option.value} id={option.value} />
                      <div className={option.color}>
                        {option.icon}
                      </div>
                      <div className="flex-1">
                        <Label htmlFor={option.value} className="cursor-pointer">
                          <div className="font-medium">{option.label}</div>
                          <div className="text-sm text-gray-600">{option.description}</div>
                        </Label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </RadioGroup>
          </div>

          {/* Período */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Período</Label>
            <Select value={period} onValueChange={(value: ExportPeriod) => setPeriod(value)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current-month">Mês Atual</SelectItem>
                <SelectItem value="last-month">Mês Anterior</SelectItem>
                <SelectItem value="all">Todas as Transa��ões</SelectItem>
                <SelectItem value="custom">Período Personalizado</SelectItem>
              </SelectContent>
            </Select>

            {/* Datas Personalizadas */}
            {period === 'custom' && (
              <div className="grid grid-cols-2 gap-4 mt-4">
                <div className="space-y-2">
                  <Label>Data Início</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className="w-full justify-start text-left">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {startDate ?
                          formatDate(startDate, 'dd/MM/yyyy', { locale: ptBR }) :
                          'Selecionar'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={startDate}
                        onSelect={setStartDate}
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
                        {endDate ?
                          formatDate(endDate, 'dd/MM/yyyy', { locale: ptBR }) :
                          'Selecionar'
                        }
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0">
                      <Calendar
                        mode="single"
                        selected={endDate}
                        onSelect={setEndDate}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            )}
          </div>

          {/* Resumo da Exportação */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Filter className="h-4 w-4" />
                Resumo da Exportação
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                <div>
                  <p className="text-2xl font-bold">{exportSummary.total}</p>
                  <p className="text-sm text-gray-600">Transações</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-green-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact'
                    }).format(exportSummary.receitas)}
                  </p>
                  <p className="text-sm text-gray-600">Receitas</p>
                </div>
                <div>
                  <p className="text-2xl font-bold text-red-600">
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact'
                    }).format(exportSummary.despesas)}
                  </p>
                  <p className="text-sm text-gray-600">Despesas</p>
                </div>
                <div>
                  <p className={`text-2xl font-bold ${exportSummary.saldo >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    {new Intl.NumberFormat('pt-BR', {
                      style: 'currency',
                      currency: 'BRL',
                      notation: 'compact'
                    }).format(exportSummary.saldo)}
                  </p>
                  <p className="text-sm text-gray-600">Saldo</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Botões */}
          <div className="flex gap-3 pt-4">
            <Button 
              variant="outline" 
              onClick={() => onOpenChange?.(false)}
              className="flex-1"
            >
              Cancelar
            </Button>
            <Button 
              onClick={handleExport}
              disabled={isExporting || exportSummary.total === 0}
              className="flex-1"
            >
              {isExporting ? (
                'Exportando...'
              ) : (
                <>
                  <Download className="h-4 w-4 mr-2" />
                  Exportar {exportSummary.total} transação(ões)
                </>
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
