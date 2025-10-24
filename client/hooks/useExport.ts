import { useFinancial } from '../contexts/FinancialContext';
import { useGoals } from '../contexts/GoalsContext';
import { useInvestments } from '../contexts/InvestmentContext';
import { useBudget } from '../contexts/BudgetContext';
import { Transaction, ExportOptions } from '@shared/financial-types';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export function useExport() {
  const { transactions, categories, getFilteredTransactions } = useFinancial();
  const { goals } = useGoals();
  const { investments } = useInvestments();
  const { categories: budgetCategories, expenses: budgetExpenses } = useBudget();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL'
    }).format(value);
  };

  const formatDate = (dateString: string) => {
    return format(new Date(dateString), 'dd/MM/yyyy', { locale: ptBR });
  };

  const getCategoryName = (categoryId: string) => {
    const category = categories.find(cat => cat.id === categoryId);
    return category?.name || categoryId;
  };

  const exportToCSV = (transactions?: Transaction[]) => {
    const data = transactions || getFilteredTransactions();
    
    if (data.length === 0) {
      alert('Nenhuma transação para exportar');
      return;
    }

    // Cabeçalhos CSV
    const headers = [
      'Data',
      'Tipo',
      'Categoria',
      'Descrição',
      'Valor',
      'Fonte',
      'Tags'
    ];

    // Converter dados
    const csvRows = [
      headers.join(','),
      ...data.map(transaction => [
        formatDate(transaction.date),
        transaction.type === 'receita' ? 'Receita' : 'Despesa',
        getCategoryName(transaction.category),
        `"${transaction.description.replace(/"/g, '""')}"`, // Escapar aspas
        transaction.amount.toString().replace('.', ','), // Formato brasileiro
        transaction.source,
        `"${(transaction.tags || []).join(', ')}"`
      ].join(','))
    ];

    // Criar e baixar arquivo
    const csvContent = csvRows.join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' }); // BOM para UTF-8
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `capital-transacoes-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportToJSON = (transactions?: Transaction[]) => {
    const data = transactions || getFilteredTransactions();

    const exportData = {
      exportDate: new Date().toISOString(),
      version: '2.0',
      summary: {
        totalTransactions: data.length,
        totalReceitas: data.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0),
        totalDespesas: data.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0),
        totalGoals: goals.length,
        totalInvestments: investments.length,
        totalBudgetCategories: budgetCategories.length,
        totalBudgetExpenses: budgetExpenses.length
      },
      data: {
        transactions: data.map(transaction => ({
          ...transaction,
          categoryName: getCategoryName(transaction.category)
        })),
        categories: categories,
        goals: goals,
        investments: investments,
        budgetCategories: budgetCategories,
        budgetExpenses: budgetExpenses
      }
    };

    const jsonContent = JSON.stringify(exportData, null, 2);
    const blob = new Blob([jsonContent], { type: 'application/json' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', `capital-backup-completo-${format(new Date(), 'yyyy-MM-dd')}.json`);
    link.style.visibility = 'hidden';
    
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const generatePDFContent = (transactions?: Transaction[]) => {
    const data = transactions || getFilteredTransactions();
    
    if (data.length === 0) {
      alert('Nenhuma transação para exportar');
      return;
    }

    // Calcular totais
    const totalReceitas = data.filter(t => t.type === 'receita').reduce((sum, t) => sum + t.amount, 0);
    const totalDespesas = data.filter(t => t.type === 'despesa').reduce((sum, t) => sum + t.amount, 0);
    const saldo = totalReceitas - totalDespesas;

    // Gerar HTML para PDF
    const htmlContent = `
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Relatório Financeiro - Capital</title>
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Arial, sans-serif;
            margin: 40px;
            color: #333;
            line-height: 1.6;
        }
        .header {
            text-align: center;
            margin-bottom: 40px;
            border-bottom: 2px solid #2563eb;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #2563eb;
            margin: 0;
            font-size: 2.5em;
        }
        .header p {
            margin: 10px 0 0 0;
            color: #666;
            font-size: 1.1em;
        }
        .summary {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
            gap: 20px;
            margin: 30px 0;
            padding: 20px;
            background: #f8fafc;
            border-radius: 8px;
        }
        .summary-item {
            text-align: center;
        }
        .summary-item h3 {
            margin: 0 0 10px 0;
            color: #374151;
            font-size: 0.9em;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        .summary-item .value {
            font-size: 1.5em;
            font-weight: bold;
            margin: 0;
        }
        .receitas { color: #10b981; }
        .despesas { color: #ef4444; }
        .saldo { color: ${saldo >= 0 ? '#10b981' : '#ef4444'}; }
        .transactions {
            margin-top: 40px;
        }
        .transactions h2 {
            color: #374151;
            border-bottom: 1px solid #e5e7eb;
            padding-bottom: 10px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 20px;
            font-size: 0.9em;
        }
        th, td {
            padding: 12px 8px;
            text-align: left;
            border-bottom: 1px solid #e5e7eb;
        }
        th {
            background: #f9fafb;
            font-weight: 600;
            color: #374151;
        }
        .tipo-receita {
            background: #dcfce7;
            color: #166534;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .tipo-despesa {
            background: #fee2e2;
            color: #991b1b;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: 600;
        }
        .valor-receita { color: #10b981; font-weight: 600; }
        .valor-despesa { color: #ef4444; font-weight: 600; }
        .footer {
            margin-top: 40px;
            text-align: center;
            color: #666;
            font-size: 0.9em;
            border-top: 1px solid #e5e7eb;
            padding-top: 20px;
        }
        @media print {
            body { margin: 20px; }
            .header h1 { font-size: 2em; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>💰 Capital</h1>
        <p>Relatório Financeiro - ${format(new Date(), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })}</p>
    </div>

    <div class="summary">
        <div class="summary-item">
            <h3>Total de Receitas</h3>
            <p class="value receitas">${formatCurrency(totalReceitas)}</p>
        </div>
        <div class="summary-item">
            <h3>Total de Despesas</h3>
            <p class="value despesas">${formatCurrency(totalDespesas)}</p>
        </div>
        <div class="summary-item">
            <h3>Saldo</h3>
            <p class="value saldo">${formatCurrency(saldo)}</p>
        </div>
        <div class="summary-item">
            <h3>Transações</h3>
            <p class="value">${data.length}</p>
        </div>
    </div>

    <div class="transactions">
        <h2>Detalhamento das Transações</h2>
        <table>
            <thead>
                <tr>
                    <th>Data</th>
                    <th>Tipo</th>
                    <th>Categoria</th>
                    <th>Descrição</th>
                    <th>Valor</th>
                </tr>
            </thead>
            <tbody>
                ${data.map(transaction => `
                    <tr>
                        <td>${formatDate(transaction.date)}</td>
                        <td>
                            <span class="tipo-${transaction.type}">
                                ${transaction.type === 'receita' ? 'Receita' : 'Despesa'}
                            </span>
                        </td>
                        <td>${getCategoryName(transaction.category)}</td>
                        <td>${transaction.description}</td>
                        <td class="valor-${transaction.type}">
                            ${transaction.type === 'receita' ? '+' : '-'}${formatCurrency(transaction.amount)}
                        </td>
                    </tr>
                `).join('')}
            </tbody>
        </table>
    </div>

    <div class="footer">
        <p>Relatório gerado automaticamente pelo Capital - Sistema de Controle Financeiro Pessoal</p>
        <p>Este documento contém ${data.length} transação(ões) do período analisado</p>
    </div>
</body>
</html>`;

    // Abrir em nova janela para impressão/PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      
      // Aguardar carregamento e abrir dialog de impressão
      setTimeout(() => {
        printWindow.focus();
        printWindow.print();
      }, 500);
    }
  };

  const exportData = (format: 'csv' | 'json' | 'pdf', transactions?: Transaction[]) => {
    switch (format) {
      case 'csv':
        exportToCSV(transactions);
        break;
      case 'json':
        exportToJSON(transactions);
        break;
      case 'pdf':
        generatePDFContent(transactions);
        break;
      default:
        console.error('Formato de exportação não suportado:', format);
    }
  };

  return {
    exportToCSV,
    exportToJSON,
    generatePDFContent,
    exportData,
  };
}
