import { useState } from 'react';
import { useFinancial } from '../contexts/FinancialContext';
import { useGoals } from '../contexts/GoalsContext';
import { useInvestments } from '../contexts/InvestmentContext';
import { useBudget } from '../contexts/BudgetContext';
import { Transaction, DEFAULT_CATEGORIES } from '@shared/financial-types';
import { BankType, getBankFormat, BANK_FORMATS } from '@shared/bank-formats';
import * as pdfjsLib from 'pdfjs-dist';

interface ImportResult {
  success: boolean;
  message: string;
  importedCount?: number;
  errors?: string[];
}

export function useImport() {
  const { addTransaction, categories } = useFinancial();
  const { addGoal } = useGoals();
  const { addInvestment } = useInvestments();
  const { addCategory: addBudgetCategory, addExpense } = useBudget();
  const [isImporting, setIsImporting] = useState(false);

  // Helpers para resolver IDs reais das categorias do banco
  const normalize = (s?: string) => (s || '')
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

  const slugToName: Record<string, string> = {
    salario: 'Salário',
    freelance: 'Freelance',
    rendimentos: 'Rendimentos',
    'outras-receitas': 'Outras Receitas',
    alimentacao: 'Alimentação',
    transporte: 'Transporte',
    moradia: 'Moradia',
    saude: 'Saúde',
    educacao: 'Educação',
    entretenimento: 'Entretenimento',
    compras: 'Compras',
    servicos: 'Serviços',
    'outros-despesas': 'Outras Despesas',
  };

  const resolveCategoryId = (slug: string): { id: string | undefined; name: string | undefined } => {
    const expectedName = slugToName[slug] || slug;
    const match = categories.find(c => normalize(c.name) === normalize(expectedName));
    return { id: match?.id, name: match?.name };
  };

  // Função para mapear texto para categoria baseado nos padrões reais dos extratos
  const mapTextToCategory = (text: string): string => {
    const lowerText = text.toLowerCase();

    // Alimentação - baseado nos exemplos reais
    if (lowerText.includes('uber eats') || lowerText.includes('ifood') ||
        lowerText.includes('delivery') || lowerText.includes('restaurante') ||
        lowerText.includes('lanche') || lowerText.includes('mercado') ||
        lowerText.includes('supermercado') || lowerText.includes('padaria') ||
        lowerText.includes('bar') || lowerText.includes('conversa afiada') ||
        lowerText.includes('vila amazonas')) {
      return 'alimentacao';
    }

    // Transporte - baseado nos exemplos reais
    if (lowerText.includes('uber trip') || lowerText.includes('uber') ||
        lowerText.includes('taxi') || lowerText.includes('combustivel') ||
        lowerText.includes('gasolina') || lowerText.includes('posto') ||
        lowerText.includes('metro') || lowerText.includes('onibus') ||
        lowerText.includes('estacionamento') || lowerText.includes('99')) {
      return 'transporte';
    }

    // Entretenimento - baseado nos exemplos
    if (lowerText.includes('conversa afiada bar') || lowerText.includes('bar e') ||
        lowerText.includes('cinema') || lowerText.includes('netflix') ||
        lowerText.includes('spotify') || lowerText.includes('show') ||
        lowerText.includes('entretenimento')) {
      return 'entretenimento';
    }

    // Serviços financeiros
    if (lowerText.includes('pagamento de fatura') || lowerText.includes('pagamento da fatura') ||
        lowerText.includes('fatura') || lowerText.includes('cartao') ||
        lowerText.includes('99negocia')) {
      return 'servicos';
    }

    // Moradia
    if (lowerText.includes('aluguel') || lowerText.includes('condominio') ||
        lowerText.includes('energia') || lowerText.includes('agua') ||
        lowerText.includes('gas') || lowerText.includes('internet') ||
        lowerText.includes('telefone')) {
      return 'moradia';
    }

    // Saúde
    if (lowerText.includes('farmacia') || lowerText.includes('medico') ||
        lowerText.includes('hospital') || lowerText.includes('consulta') ||
        lowerText.includes('exame') || lowerText.includes('plano de saude') ||
        lowerText.includes('dmav') || lowerText.includes('dimave')) {
      return 'saude';
    }

    // Compras e outros gastos
    if (lowerText.includes('pacaki') || lowerText.includes('loja') ||
        lowerText.includes('shopping') || lowerText.includes('amazon') ||
        lowerText.includes('mercado livre') || lowerText.includes('magazine')) {
      return 'compras';
    }

    // Receitas - PIX recebido, salários, etc
    if (lowerText.includes('transferencia recebida') ||
        lowerText.includes('pix recebido') || lowerText.includes('salario') ||
        lowerText.includes('deposito') || lowerText.includes('freelance') ||
        (lowerText.includes('transferencia') && !lowerText.includes('enviada'))) {
      return 'salario';
    }

    // Padrão para despesas não categorizadas
    return 'outros-despesas';
  };

  // Função para detectar se é receita ou despesa baseado nos padrões reais
  const detectTransactionType = (amount: number, description: string): 'receita' | 'despesa' => {
    const lowerDesc = description.toLowerCase();

    // Para valores positivos no CSV (receitas)
    if (amount > 0) {
      // Palavras-chave que indicam receita
      if (lowerDesc.includes('transferencia recebida') ||
          lowerDesc.includes('recebida') ||
          lowerDesc.includes('salario') || lowerDesc.includes('deposito') ||
          lowerDesc.includes('freelance') || lowerDesc.includes('renda') ||
          lowerDesc.includes('pagamento da fatura') || // Este é um crédito/estorno
          lowerDesc.includes('credito')) {
        return 'receita';
      }
    }

    // Para valores negativos ou gastos identificados (despesas)
    if (amount < 0 ||
        lowerDesc.includes('transferencia enviada') ||
        lowerDesc.includes('enviada') ||
        lowerDesc.includes('uber') ||
        lowerDesc.includes('ifood') ||
        lowerDesc.includes('pagamento de fatura') ||
        lowerDesc.includes('99negocia')) {
      return 'despesa';
    }

    // Se valor é positivo mas não está nas categorias de receita, é despesa
    return amount < 0 ? 'despesa' : 'receita';
  };

  // Função para fazer parsing avançado de CSV
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  };

  // Parser específico para formato Nubank
  const parseNubankCSV = (lines: string[], fileName: string): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // Pular cabeçalho (date,title,amount)
    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);

      if (columns.length >= 3) {
        const dateStr = columns[0]; // YYYY-MM-DD
        const title = columns[1];
        const amountStr = columns[2];

        // Converter data ISO para formato brasileiro
        const date = dateStr; // Já está no formato ISO

        // Converter valor (Nubank usa ponto decimal)
        const amount = Math.abs(parseFloat(amountStr.replace(',', '.')));

        if (!isNaN(amount) && amount > 0) {
          // No Nubank, valores negativos são receitas (ex: "Pagamento recebido")
          // Valores positivos são despesas normais
          let type: 'receita' | 'despesa' = 'despesa';

          // Detectar receitas baseado na descrição ou valor negativo
          if (parseFloat(amountStr) < 0 ||
              title.toLowerCase().includes('pagamento recebido') ||
              title.toLowerCase().includes('transferencia recebida') ||
              title.toLowerCase().includes('pix recebido') ||
              title.toLowerCase().includes('salario') ||
              title.toLowerCase().includes('deposito')) {
            type = 'receita';
          }

          const slug = mapTextToCategory(title);
          const { id: categoryId, name: categoryName } = resolveCategoryId(slug);

          transactions.push({
            type,
            category: categoryId || categories[0]?.id,
            categoryName: categoryName,
            description: title.length > 100 ? title.substring(0, 100) + '...' : title,
            amount,
            date,
            source: 'importacao',
            sourceDetails: {
              fileName,
              bank: 'Nubank'
            },
            tags: ['importado', 'csv', 'nubank']
          });
        }
      }
    }

    return transactions;
  };

  // Parser específico para formato RecargaPay
  const parseRecargaPayCSV = (lines: string[], fileName: string): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

    // Pular cabeçalho (Data,Transação,Valor)
    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);

      if (columns.length >= 3) {
        const dateStr = columns[0]; // DD/MM/YYYY
        const title = columns[1];
        const valueStr = columns[2]; // - R$ 99,99 ou + R$ 99,99

        // Converter data DD/MM/YYYY para ISO
        const dateParts = dateStr.split('/');
        if (dateParts.length === 3) {
          const [day, month, year] = dateParts;
          const date = `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          // Extrair valor (remover R$, espaços e converter vírgula para ponto)
          const cleanValue = valueStr.replace(/[R$\s]/g, '').replace(',', '.');
          const amount = Math.abs(parseFloat(cleanValue));

          if (!isNaN(amount) && amount > 0) {
            // Detectar tipo baseado no sinal
            const type: 'receita' | 'despesa' = cleanValue.startsWith('+') ||
              title.toLowerCase().includes('pagamento da fatura') ||
              title.toLowerCase().includes('pagamento recebido')
              ? 'receita' : 'despesa';

            const slug = mapTextToCategory(title);
          const { id: categoryId, name: categoryName } = resolveCategoryId(slug);

          transactions.push({
            type,
            category: categoryId || categories[0]?.id,
            categoryName: categoryName,
            description: title.length > 100 ? title.substring(0, 100) + '...' : title,
            amount,
            date,
              source: 'importacao',
              sourceDetails: {
                fileName,
                bank: 'RecargaPay'
              },
              tags: ['importado', 'csv', 'recargapay']
            });
          }
        }
      }
    }

    return transactions;
  };

  // Parser genérico para outros bancos
  const parseGenericCSV = (lines: string[], fileName: string, bankType: BankType): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const bankFormat = getBankFormat(bankType);

    if (!bankFormat) {
      return transactions;
    }

    const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());

    // Detectar colunas baseado no formato do banco
    let dateColumnIndex = -1;
    let amountColumnIndex = -1;
    let descriptionColumnIndex = -1;

    // Mapear colunas baseado no formato do banco
    const expectedColumns = bankFormat.csvFormat.columns.map(col => col.toLowerCase());

    expectedColumns.forEach((expectedCol, index) => {
      const foundIndex = headers.findIndex(h =>
        h.includes(expectedCol) ||
        (expectedCol.includes('data') && h.includes('data')) ||
        (expectedCol.includes('valor') && h.includes('valor')) ||
        (expectedCol.includes('descrição') && (h.includes('descri') || h.includes('historic') || h.includes('lançamento')))
      );

      if (foundIndex !== -1) {
        if (expectedCol.includes('data') || expectedCol === 'date') {
          dateColumnIndex = foundIndex;
        } else if (expectedCol.includes('valor') || expectedCol === 'amount') {
          amountColumnIndex = foundIndex;
        } else if (expectedCol.includes('descrição') || expectedCol === 'title' || expectedCol.includes('historic') || expectedCol.includes('lançamento')) {
          descriptionColumnIndex = foundIndex;
        }
      }
    });

    // Fallback para detecção automática
    if (dateColumnIndex === -1) {
      dateColumnIndex = headers.findIndex(h => h.includes('data') || h.includes('date'));
    }
    if (amountColumnIndex === -1) {
      amountColumnIndex = headers.findIndex(h => h.includes('valor') || h.includes('amount'));
    }
    if (descriptionColumnIndex === -1) {
      descriptionColumnIndex = headers.findIndex(h =>
        h.includes('descri') || h.includes('historic') || h.includes('title') || h.includes('lançamento')
      );
    }

    // Processar linhas
    for (let i = 1; i < lines.length; i++) {
      const columns = parseCSVLine(lines[i]);

      if (columns.length > Math.max(dateColumnIndex, amountColumnIndex, descriptionColumnIndex)) {
        const dateStr = columns[dateColumnIndex];
        const amountStr = columns[amountColumnIndex];
        const description = columns[descriptionColumnIndex] || `Transação ${i}`;

        // Converter data baseado no formato do banco
        let date: string;
        if (bankFormat.csvFormat.dateFormat === 'YYYY-MM-DD') {
          date = dateStr; // Já está no formato ISO
        } else {
          // Formato DD/MM/YYYY
          const dateParts = dateStr.split('/');
          if (dateParts.length === 3) {
            const [day, month, year] = dateParts;
            date = `${year.padStart(4, '20')}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
          } else {
            continue;
          }
        }

        // Converter valor
        let amount: number;
        try {
          const cleanAmount = amountStr.replace(/[^\d,-]/g, '').replace(',', '.');
          amount = parseFloat(cleanAmount);
          if (isNaN(amount)) continue;
        } catch {
          continue;
        }

        const absoluteAmount = Math.abs(amount);
        const type = detectTransactionType(amount, description);
        const slug = mapTextToCategory(description);
        const { id: categoryId, name: categoryName } = resolveCategoryId(slug);

        transactions.push({
          type,
          category: categoryId || categories[0]?.id,
          categoryName: categoryName,
          description: description.length > 100 ? description.substring(0, 100) + '...' : description,
          amount: absoluteAmount,
          date,
          source: 'importacao',
          sourceDetails: {
            fileName,
            bank: bankFormat.name
          },
          tags: ['importado', 'csv', bankType]
        });
      }
    }

    return transactions;
  };

  // Importação de CSV melhorada para formato brasileiro
  const importFromCSV = async (file: File, selectedBank: BankType = 'generic'): Promise<ImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const lines = text.split('\n').filter(line => line.trim());

          if (lines.length < 2) {
            resolve({
              success: false,
              message: 'Arquivo CSV deve ter pelo menos uma linha de cabeçalho e uma linha de dados'
            });
            return;
          }

          let transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];

          // Usar parser específico baseado no banco selecionado
          if (selectedBank === 'nubank') {
            transactions = parseNubankCSV(lines, file.name);
          } else if (selectedBank === 'recargapay') {
            transactions = parseRecargaPayCSV(lines, file.name);
          } else {
            transactions = parseGenericCSV(lines, file.name, selectedBank);
          }

          // Calcular estatísticas das importações
          const receitas = transactions.filter(t => t.type === 'receita').length;
          const despesas = transactions.filter(t => t.type === 'despesa').length;
          const totalValue = transactions.reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);

          const bankName = getBankFormat(selectedBank)?.name || 'formato desconhecido';
          const message = transactions.length > 0
            ? `${transactions.length} transaç��o(ões) importada(s) do ${bankName}: ${receitas} receitas, ${despesas} despesas. Saldo líquido: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(totalValue)}`
            : 'Nenhuma transação válida foi encontrada';

          resolve({
            success: transactions.length > 0,
            message,
            importedCount: transactions.length
          });

          // Adicionar transações ao contexto
          transactions.forEach(transaction => {
            addTransaction(transaction);
          });

        } catch (error) {
          resolve({
            success: false,
            message: `Erro ao processar arquivo CSV: ${error}`
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Erro ao ler o arquivo'
        });
      };

      reader.readAsText(file, 'UTF-8');
    });
  };

  // Configurar PDF.js worker
  const initPdfJs = () => {
    if (typeof window !== 'undefined' && !pdfjsLib.GlobalWorkerOptions.workerSrc) {
      try {
        // Usar a mesma versão do pacote instalado (5.3.93)
        pdfjsLib.GlobalWorkerOptions.workerSrc = `https://unpkg.com/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.js`;
      } catch (error) {
        console.warn('Erro ao configurar PDF.js worker com versão dinâmica:', error);
        // Fallback para CDN com versão específica
        try {
          pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;
        } catch (fallbackError) {
          console.error('Erro ao configurar PDF.js worker fallback:', fallbackError);
          // Último fallback com versão fixa mais recente
          pdfjsLib.GlobalWorkerOptions.workerSrc = 'https://unpkg.com/pdfjs-dist@5.3.93/build/pdf.worker.min.js';
        }
      }
    }
  };

  // Extração de transações de PDF de fatura de cartão
  const extractTransactionsFromPDFText = (text: string, fileName: string): Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] => {
    const transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[] = [];
    const lines = text.split('\n').map(line => line.trim()).filter(line => line);

    let currentDate = '';
    const currentYear = new Date().getFullYear();

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Detectar linha de data (formato DD/MM/YYYY)
      const dateMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})/);
      if (dateMatch) {
        currentDate = dateMatch[1];

        // Próximas linhas podem conter transações
        for (let j = i + 1; j < lines.length && j < i + 10; j++) {
          const transactionLine = lines[j];

          // Parar se encontrar outra data
          if (transactionLine.match(/^\d{2}\/\d{2}\/\d{4}/)) {
            break;
          }

          // Detectar valores (formato - R$ XX,XX ou + R$ XX,XX)
          const valueMatch = transactionLine.match(/([-+]?\s*R\$\s*[\d.,]+)/);
          if (valueMatch) {
            const valueStr = valueMatch[1].replace(/[R$\s]/g, '').replace(',', '.');
            const amount = Math.abs(parseFloat(valueStr));

            if (!isNaN(amount) && amount > 0) {
              // Extrair descrição (tudo antes do valor)
              const description = transactionLine.replace(/([-+]?\s*R\$\s*[\d.,]+).*/, '').trim();

              if (description && description.length > 2) {
                const isCredit = valueStr.startsWith('+') || transactionLine.includes('Pagamento');
                const type: 'receita' | 'despesa' = isCredit ? 'receita' : 'despesa';
                const category = mapTextToCategory(description);
                const categoryInfo = categories.find(cat => cat.id === category);

                // Converter data para formato ISO
                const [day, month, year] = currentDate.split('/');
                const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

                transactions.push({
                  type,
                  category,
                  categoryName: categoryInfo?.name,
                  description: description.length > 100 ? description.substring(0, 100) + '...' : description,
                  amount,
                  date: isoDate,
                  source: 'importacao',
                  sourceDetails: {
                    fileName
                  },
                  tags: ['importado', 'pdf', 'fatura']
                });
              }
            }
          }
        }
      }

      // Formato alternativo: linha com data, descrição e valor separados
      const fullLineMatch = line.match(/^(\d{2}\/\d{2}\/\d{4})\s+(.+?)\s+([-+]?\s*R\$\s*[\d.,]+)/);
      if (fullLineMatch) {
        const [, date, description, valueStr] = fullLineMatch;
        const cleanValue = valueStr.replace(/[R$\s]/g, '').replace(',', '.');
        const amount = Math.abs(parseFloat(cleanValue));

        if (!isNaN(amount) && amount > 0) {
          const isCredit = cleanValue.startsWith('+') || description.includes('Pagamento');
          const type: 'receita' | 'despesa' = isCredit ? 'receita' : 'despesa';
          const category = mapTextToCategory(description);
          const categoryInfo = categories.find(cat => cat.id === category);

          const [day, month, year] = date.split('/');
          const isoDate = `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;

          transactions.push({
            type,
            category,
            categoryName: categoryInfo?.name,
            description: description.trim().length > 100 ? description.trim().substring(0, 100) + '...' : description.trim(),
            amount,
            date: isoDate,
            source: 'importacao',
            sourceDetails: {
              fileName
            },
            tags: ['importado', 'pdf', 'fatura']
          });
        }
      }
    }

    // Remover duplicatas baseadas em data, descriç��o e valor
    const uniqueTransactions = transactions.filter((transaction, index, self) =>
      index === self.findIndex(t =>
        t.date === transaction.date &&
        t.description === transaction.description &&
        t.amount === transaction.amount
      )
    );

    return uniqueTransactions;
  };

  // Importação de PDF real
  const importFromPDF = async (file: File): Promise<ImportResult> => {
    initPdfJs();

    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target?.result as ArrayBuffer;
          const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;

          let fullText = '';

          // Extrair texto de todas as páginas
          for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
            try {
              const page = await pdf.getPage(pageNum);
              const textContent = await page.getTextContent();
              const pageText = textContent.items
                .map((item: any) => item.str)
                .join(' ');
              fullText += pageText + '\n';
            } catch (pageError) {
              console.warn(`Erro ao processar página ${pageNum}:`, pageError);
            }
          }

          if (!fullText.trim()) {
            resolve({
              success: false,
              message: 'Não foi possível extrair texto do PDF. O arquivo pode estar protegido ou corrompido.'
            });
            return;
          }

          // Extrair transações do texto
          const transactions = extractTransactionsFromPDFText(fullText, file.name);

          if (transactions.length === 0) {
            resolve({
              success: false,
              message: 'Não foram encontradas transações válidas no PDF. Verifique se é uma fatura de cartão ou extrato bancário.'
            });
            return;
          }

          // Adicionar transações ao contexto
          transactions.forEach(transaction => {
            addTransaction(transaction);
          });

          // Calcular estatísticas das importações do PDF
          const receitas = transactions.filter(t => t.type === 'receita').length;
          const despesas = transactions.filter(t => t.type === 'despesa').length;
          const totalValue = transactions.reduce((sum, t) => sum + (t.type === 'receita' ? t.amount : -t.amount), 0);

          const message = `${transactions.length} transação(ões) extraída(s) do PDF: ${receitas} receitas, ${despesas} despesas. Total: ${new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(Math.abs(totalValue))}`;

          resolve({
            success: true,
            message,
            importedCount: transactions.length
          });

        } catch (error) {
          console.error('Erro ao processar PDF:', error);
          resolve({
            success: false,
            message: `Erro ao processar PDF: ${error instanceof Error ? error.message : 'Erro desconhecido'}`
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Erro ao ler o arquivo PDF'
        });
      };

      reader.readAsArrayBuffer(file);
    });
  };

  // Importação de backup completo JSON
  const importFromJSON = async (file: File): Promise<ImportResult> => {
    return new Promise((resolve) => {
      const reader = new FileReader();

      reader.onload = (e) => {
        try {
          const text = e.target?.result as string;
          const backupData = JSON.parse(text);

          // Verificar se é um backup válido
          if (!backupData.version || !backupData.data) {
            resolve({
              success: false,
              message: 'Arquivo JSON não é um backup válido do Capital'
            });
            return;
          }

          let importedCount = 0;
          const errors: string[] = [];

          // Importar transações
          if (backupData.data.transactions && Array.isArray(backupData.data.transactions)) {
            backupData.data.transactions.forEach((transaction: any) => {
              try {
                addTransaction({
                  type: transaction.type,
                  category: transaction.category,
                  description: transaction.description,
                  amount: transaction.amount,
                  date: transaction.date,
                  source: transaction.source || 'importacao',
                  tags: [...(transaction.tags || []), 'backup-restaurado']
                });
                importedCount++;
              } catch (error) {
                errors.push(`Erro ao importar transação: ${transaction.description || 'N/A'}`);
              }
            });
          }

          // Importar objetivos
          if (backupData.data.goals && Array.isArray(backupData.data.goals)) {
            backupData.data.goals.forEach((goal: any) => {
              try {
                addGoal({
                  name: goal.name,
                  category: goal.category,
                  targetAmount: goal.targetAmount,
                  currentAmount: goal.currentAmount,
                  deadline: goal.deadline,
                  description: goal.description
                });
                importedCount++;
              } catch (error) {
                errors.push(`Erro ao importar objetivo: ${goal.name || 'N/A'}`);
              }
            });
          }

          // Importar investimentos
          if (backupData.data.investments && Array.isArray(backupData.data.investments)) {
            backupData.data.investments.forEach((investment: any) => {
              try {
                addInvestment({
                  type: investment.type,
                  name: investment.name,
                  quantity: investment.quantity,
                  purchasePrice: investment.purchasePrice,
                  purchaseDate: investment.purchaseDate || new Date().toISOString().split('T')[0]
                });
                importedCount++;
              } catch (error) {
                errors.push(`Erro ao importar investimento: ${investment.name || 'N/A'}`);
              }
            });
          }

          // Importar categorias de orçamento
          if (backupData.data.budgetCategories && Array.isArray(backupData.data.budgetCategories)) {
            backupData.data.budgetCategories.forEach((category: any) => {
              try {
                addBudgetCategory({
                  name: category.name,
                  monthlyLimit: category.monthlyLimit,
                  description: category.description,
                  icon: category.icon,
                  color: category.color
                });
                importedCount++;
              } catch (error) {
                errors.push(`Erro ao importar categoria de orçamento: ${category.name || 'N/A'}`);
              }
            });
          }

          // Importar despesas de orçamento
          if (backupData.data.budgetExpenses && Array.isArray(backupData.data.budgetExpenses)) {
            backupData.data.budgetExpenses.forEach((expense: any) => {
              try {
                addExpense({
                  categoryId: expense.categoryId,
                  amount: expense.amount,
                  description: expense.description,
                  date: expense.date,
                  transactionId: expense.transactionId
                });
                importedCount++;
              } catch (error) {
                errors.push(`Erro ao importar despesa de orçamento: ${expense.description || 'N/A'}`);
              }
            });
          }

          const summary = backupData.summary || {};
          const message = `Backup restaurado com sucesso!
            ${importedCount} itens importados:
            • ${summary.totalTransactions || 0} transações
            • ${summary.totalGoals || 0} objetivos
            • ${summary.totalInvestments || 0} investimentos
            • ${summary.totalBudgetCategories || 0} categorias de orçamento
            • ${summary.totalBudgetExpenses || 0} despesas de orçamento
            ${errors.length > 0 ? `\n${errors.length} erro(s) encontrado(s)` : ''}`;

          resolve({
            success: importedCount > 0,
            message,
            importedCount,
            errors: errors.length > 0 ? errors : undefined
          });

        } catch (error) {
          resolve({
            success: false,
            message: `Erro ao processar backup JSON: ${error}`
          });
        }
      };

      reader.onerror = () => {
        resolve({
          success: false,
          message: 'Erro ao ler o arquivo JSON'
        });
      };

      reader.readAsText(file, 'UTF-8');
    });
  };

  // Função principal de importação
  const importFile = async (file: File, selectedBank: BankType = 'generic'): Promise<ImportResult> => {
    setIsImporting(true);

    try {
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      switch (fileExtension) {
        case 'csv':
          return await importFromCSV(file, selectedBank);
        case 'pdf':
          return await importFromPDF(file);
        case 'json':
          return await importFromJSON(file);
        default:
          return {
            success: false,
            message: 'Formato de arquivo não suportado. Use CSV, PDF ou JSON.'
          };
      }
    } finally {
      setIsImporting(false);
    }
  };

  // Função para gerar template CSV baseado no banco selecionado
  const downloadCSVTemplate = (bankType: BankType = 'generic') => {
    const bankFormat = getBankFormat(bankType);

    if (!bankFormat) {
      alert('Formato de banco não encontrado');
      return;
    }

    const csvContent = [
      bankFormat.sampleData[0].join(','),
      ...bankFormat.sampleData.slice(1).map(row =>
        bankType === 'nubank'
          ? row.join(',')
          : row.map(cell => `"${cell}"`).join(',')
      )
    ].join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', `template-${bankFormat.name.toLowerCase().replace(/\s+/g, '-')}-capital.csv`);
    link.style.visibility = 'hidden';

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return {
    importFile,
    downloadCSVTemplate,
    isImporting,
    bankFormats: BANK_FORMATS
  };
}
