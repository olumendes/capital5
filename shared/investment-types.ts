// Tipos para investimentos e cotações
export type InvestmentType = 
  | 'bitcoin' 
  | 'ethereum' 
  | 'dolar' 
  | 'euro' 
  | 'ouro' 
  | 'prata' 
  | 'tesouro_direto' 
  | 'cdb' 
  | 'lci_lca';

export interface GoalAllocation {
  goalId: string;
  goalName: string;
  allocatedAmount: number; // Valor alocado em reais
  allocatedAt: string; // Data da alocação
}

export interface Investment {
  id: string;
  type: InvestmentType;
  name: string;
  quantity: number;
  purchasePrice: number; // Preço de compra por unidade
  purchaseDate: string;
  currentPrice?: number; // Preço atual (atualizado via API)
  currentValue?: number; // Valor atual total (quantity * currentPrice)
  profitLoss?: number; // Lucro/prejuízo
  profitLossPercent?: number; // Percentual de lucro/prejuízo
  goalAllocations?: GoalAllocation[]; // Alocações para objetivos
  createdAt: string;
  updatedAt: string;
}

export interface InvestmentOption {
  id: InvestmentType;
  name: string;
  symbol: string;
  description: string;
  icon: string;
  unit: string; // 'BTC', 'USD', 'g', etc.
  apiKey?: string; // Chave para API de cotação
}

export interface QuoteResponse {
  symbol: string;
  price: number;
  change24h?: number;
  lastUpdate: string;
}

export interface InvestmentSummary {
  totalInvested: number;
  currentValue: number;
  totalProfitLoss: number;
  totalProfitLossPercent: number;
  bestPerformer?: Investment;
  worstPerformer?: Investment;
}

// Opções de investimento disponíveis
export const INVESTMENT_OPTIONS: InvestmentOption[] = [
  {
    id: 'bitcoin',
    name: 'Bitcoin',
    symbol: 'BTC',
    description: 'Criptomoeda líder mundial',
    icon: '₿',
    unit: 'BTC',
    apiKey: 'bitcoin'
  },
  {
    id: 'ethereum',
    name: 'Ethereum',
    symbol: 'ETH',
    description: 'Segunda maior criptomoeda',
    icon: 'Ξ',
    unit: 'ETH',
    apiKey: 'ethereum'
  },
  {
    id: 'dolar',
    name: 'Dólar Americano',
    symbol: 'USD',
    description: 'Moeda americana',
    icon: '$',
    unit: 'USD',
    apiKey: 'USD-BRL'
  },
  {
    id: 'euro',
    name: 'Euro',
    symbol: 'EUR',
    description: 'Moeda europeia',
    icon: '€',
    unit: 'EUR',
    apiKey: 'EUR-BRL'
  },
  {
    id: 'ouro',
    name: 'Ouro',
    symbol: 'XAU',
    description: 'Metal precioso',
    icon: '🥇',
    unit: 'g',
    apiKey: 'gold'
  },
  {
    id: 'prata',
    name: 'Prata',
    symbol: 'XAG',
    description: 'Metal precioso',
    icon: '🥈',
    unit: 'g',
    apiKey: 'silver'
  },
  {
    id: 'tesouro_direto',
    name: 'Tesouro Direto',
    symbol: 'TD',
    description: 'Títulos do governo brasileiro',
    icon: '🏛️',
    unit: 'unidade'
  },
  {
    id: 'cdb',
    name: 'CDB',
    symbol: 'CDB',
    description: 'Certificado de Depósito Bancário',
    icon: '🏦',
    unit: 'unidade'
  },
  {
    id: 'lci_lca',
    name: 'LCI/LCA',
    symbol: 'LCI',
    description: 'Letras de Crédito',
    icon: '📋',
    unit: 'unidade'
  }
];

export function getInvestmentOption(type: InvestmentType): InvestmentOption | undefined {
  return INVESTMENT_OPTIONS.find(option => option.id === type);
}
