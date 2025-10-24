// Tipos para diferentes formatos de banco

export type BankType = 'generic' | 'nubank' | 'itau' | 'bradesco' | 'santander' | 'inter' | 'c6' | 'recargapay';

export interface BankFormat {
  id: BankType;
  name: string;
  description: string;
  csvFormat: {
    columns: string[];
    dateFormat: string;
    valueFormat: string;
    separator: string;
  };
  sampleData: string[][];
  icon?: string;
}

export const BANK_FORMATS: BankFormat[] = [
  {
    id: 'generic',
    name: 'Formato Genérico',
    description: 'Formato padrão para extratos bancários',
    csvFormat: {
      columns: ['Data', 'Valor', 'Identificador', 'Descrição'],
      dateFormat: 'DD/MM/YYYY',
      valueFormat: 'Decimal com vírgula (ex: -85,50)',
      separator: ','
    },
    sampleData: [
      ['Data', 'Valor', 'Identificador', 'Descrição'],
      ['03/06/2025', '-85,50', 'abc123', 'Uber Trip Help.u'],
      ['04/06/2025', '300,00', 'def456', 'Transferência recebida pelo Pix'],
    ],
    icon: '🏦'
  },
  {
    id: 'nubank',
    name: 'Nubank',
    description: 'Formato de exportação do Nubank',
    csvFormat: {
      columns: ['date', 'title', 'amount'],
      dateFormat: 'YYYY-MM-DD',
      valueFormat: 'Decimal com ponto (ex: 24.50)',
      separator: ','
    },
    sampleData: [
      ['date', 'title', 'amount'],
      ['2025-07-02', 'Conversa Afiada Bar e', '24.50'],
      ['2025-06-10', 'Pagamento recebido', '-1591.93'],
      ['2025-06-15', 'Drogaria Araujo', '56.96'],
    ],
    icon: '💜'
  },
  {
    id: 'itau',
    name: 'Itaú',
    description: 'Formato de exportação do Itaú',
    csvFormat: {
      columns: ['Data', 'Lançamento', 'Valor', 'Saldo'],
      dateFormat: 'DD/MM/YYYY',
      valueFormat: 'Decimal com vírgula (ex: 1.200,50)',
      separator: ';'
    },
    sampleData: [
      ['Data', 'Lançamento', 'Valor', 'Saldo'],
      ['01/06/2025', 'PIX RECEBIDO', '500,00', '2.300,50'],
      ['02/06/2025', 'COMPRA CARTAO', '-85,30', '2.215,20'],
    ],
    icon: '🔶'
  },
  {
    id: 'bradesco',
    name: 'Bradesco',
    description: 'Formato de exportação do Bradesco',
    csvFormat: {
      columns: ['Data', 'Histórico', 'Valor', 'Saldo'],
      dateFormat: 'DD/MM/YYYY',
      valueFormat: 'Decimal com vírgula (ex: -85,50)',
      separator: ','
    },
    sampleData: [
      ['Data', 'Histórico', 'Valor', 'Saldo'],
      ['01/06/2025', 'TRANSFERENCIA RECEBIDA', '800,00', '1.500,00'],
      ['02/06/2025', 'DEBITO AUTOMATICO', '-120,00', '1.380,00'],
    ],
    icon: '🔴'
  },
  {
    id: 'inter',
    name: 'Banco Inter',
    description: 'Formato de extrato do Inter',
    csvFormat: {
      columns: ['Data', 'Histórico', 'Valor', 'Saldo'],
      dateFormat: 'DD/MM/YYYY',
      valueFormat: 'Decimal com vírgula (ex: -85,50)',
      separator: ','
    },
    sampleData: [
      ['Data', 'Histórico', 'Valor', 'Saldo'],
      ['01/06/2025', 'PIX Recebido - João Silva', '250,00', '1.250,00'],
      ['02/06/2025', 'Compra no débito - Supermercado', '-45,90', '1.204,10'],
      ['03/06/2025', 'TED Recebida - Maria Santos', '500,00', '1.704,10'],
    ],
    icon: '🧡'
  },
  {
    id: 'c6',
    name: 'C6 Bank',
    description: 'Formato de exportação do C6 Bank',
    csvFormat: {
      columns: ['Data', 'Descrição', 'Categoria', 'Valor'],
      dateFormat: 'DD/MM/YYYY',
      valueFormat: 'Decimal com vírgula (ex: -85,50)',
      separator: ','
    },
    sampleData: [
      ['Data', 'Descrição', 'Categoria', 'Valor'],
      ['01/06/2025', 'Uber', 'Transporte', '-25,50'],
      ['02/06/2025', 'Salário', 'Receita', '3000,00'],
    ],
    icon: '⚫'
  },
  {
    id: 'recargapay',
    name: 'RecargaPay',
    description: 'Formato de fatura do RecargaPay',
    csvFormat: {
      columns: ['Data', 'Transação', 'Valor'],
      dateFormat: 'DD/MM/YYYY',
      valueFormat: 'Formato R$ 99,99',
      separator: ','
    },
    sampleData: [
      ['Data', 'Transação', 'Valor'],
      ['23/06/2025', '99negocia 23jun 07', '- R$ 3,00'],
      ['22/06/2025', 'Ifd Camila Liziene Lel', '- R$ 84,69'],
      ['20/06/2025', 'Uber Uber Trip Help.u', '- R$ 21,63'],
      ['10/06/2025', 'Pagamento Da Fatura', '+ R$ 232,75'],
    ],
    icon: '🔷'
  }
];

export function getBankFormat(bankId: BankType): BankFormat | undefined {
  return BANK_FORMATS.find(format => format.id === bankId);
}

export function detectBankFromCSV(csvContent: string): BankType {
  const firstLine = csvContent.split('\n')[0].toLowerCase();
  
  // Detectar Nubank pelo formato date,title,amount
  if (firstLine.includes('date,title,amount')) {
    return 'nubank';
  }
  
  // Detectar outros formatos baseado nos cabeçalhos
  if (firstLine.includes('lançamento') || firstLine.includes('lancamento')) {
    return 'itau';
  }
  
  if (firstLine.includes('histórico') || firstLine.includes('historico')) {
    return 'bradesco';
  }
  
  if (firstLine.includes('categoria')) {
    return 'c6';
  }
  
  // Padrão genérico
  return 'generic';
}
